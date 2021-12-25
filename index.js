const core = require("@actions/core");
const { exec } = require("@actions/exec");
const github = require("@actions/github");
const fetch = require("node-fetch");

const githubToken = core.getInput("github-token");
const vercelToken = core.getInput("vercel-token");
const vercelOrgId = core.getInput("vercel-org-id");
const vercelProjectId = core.getInput("vercel-project-id");
const isProduction = core.getInput("is-production") === "true";
const vercelScope = core.getInput("scope");

const vercelInspect = async (deploymentUrl) => {
  let myOutput = "";
  let myError = "";
  const options = {};
  options.listeners = {
    stdout: (data) => {
      myOutput += data.toString();
      core.info(data.toString());
    },
    stderr: (data) => {
      myError += data.toString();
      core.info(data.toString());
    },
  };

  const args = ["vercel", "inspect", deploymentUrl, "-t", vercelToken];

  if (vercelScope) {
    core.info("using scope");
    args.push("--scope", vercelScope);
  }
  await exec.exec("npx", args, options);

  const match = myError.match(/^\s+name\s+(.+)$/m);
  return match && match.length ? match[1] : null;
};

const buildComment = async ({ titleText, deploymentUrl, context }) => {
  const getRes = await fetch(
    `https://api.vercel.com/v13/deployments/${deploymentUrl}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.vercelToken}` },
    }
  );
  const res = await getRes.json();
  return `${titleText}

🔍 Inspect: ${res.inspectorUrl || null}
✅ Preview: ${deploymentUrl}

Built with commit ${context.sha}.`;
};

const main = async () => {
  core.exportVariable("VERCEL_ORG_ID", vercelOrgId);
  core.exportVariable("VERCEL_PROJECT_ID", vercelProjectId);

  const { context } = github;
  // core.info(JSON.stringify(github));

  let branchName;
  if (context.payload.pull_request) {
    branchName = context.payload.pull_request.head.ref;
  } else if (context.ref) {
    branchName = context.ref.replace("refs/heads/", "");
  } else {
    throw new Error("Branch name is undefined.");
  }

  let message;
  if (context.payload.pull_request) {
    message = context.payload.pull_request.title;
  } else if (context.payload.head_commit) {
    message = context.payload.head_commit.message;
  } else {
    message = `Deploy ${context.sha}`;
  }

  const options = {};
  let myOutput = "";
  let myError = "";
  options.listeners = {
    stdout: (data) => {
      myOutput += data.toString();
      core.info(data.toString());
    },
    stderr: (data) => {
      myError += data.toString();
      core.info(data.toString());
    },
  };
  const args = [
    "vercel",
    ...(isProduction ? ["--prod"] : []),
    "-t",
    vercelToken,
    "-m",
    `githubCommitAuthorName=${context.actor}`,
    "-m",
    `githubCommitMessage=${message}`,
    "-m",
    `githubCommitOrg=${context.repo.owner}`,
    "-m",
    `githubCommitRef=${branchName}`,
    "-m",
    `githubCommitRepo=${context.repo.repo}`,
    "-m",
    `githubCommitRepoId=${context.repo.id}`,
    "-m",
    `githubCommitSha=${context.sha}`,
    "-m",
    "githubDeployment=1",
    "-m",
    `githubOrg=${context.repo.owner}`,
    "-m",
    `githubRepo=${context.repo.repo}`,
    "-m",
    `githubRepoId=${context.repo.id}`,
    "-m",
    `githubCommitAuthorLogin=${context.actor}`,
  ];
  if (vercelScope) {
    core.info("using scope");
    args.push("--scope", vercelScope);
  }
  await exec("npx", args, options);

  const deploymentUrl = myOutput;
  if (deploymentUrl) {
    core.setOutput("preview-url", deploymentUrl);
  } else {
    throw new Error("preview-url is undefined");
  }

  const projectName = vercelInspect(deploymentUrl);
  const titleText = `Deployment preview for ${projectName}.`;

  const octokit = github.getOctokit(githubToken);
  if (context.eventName === "pull_request") {
    const res = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: context.issue.number,
    });
    const comment = res.data.find((v) => v.body.includes(titleText));
    const commentId = comment && comment.id;
    if (commentId) {
      await octokit.rest.issues.updateComment({
        ...context.repo,
        comment_id: commentId,
        body: await buildComment({ titleText, deploymentUrl, context }),
      });
    } else {
      await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: context.issue.number,
        body: await buildComment({ titleText, deploymentUrl, context }),
      });
    }
  } else if (context.eventName === "push") {
    const res = await octokit.rest.repos.listCommentsForCommit({
      ...context.repo,
      commit_sha: context.sha,
    });
    const comment = res.data.find((v) => v.body.includes(titleText));
    const commentId = comment && comment.id;
    if (commentId) {
      await octokit.rest.repos.updateCommitComment({
        ...context.repo,
        comment_id: commentId,
        body: await buildComment({ titleText, deploymentUrl, context }),
      });
    } else {
      await octokit.rest.repos.createCommitComment({
        ...context.repo,
        commit_sha: context.sha,
        body: await buildComment({ titleText, deploymentUrl, context }),
      });
    }
  }
};
main().catch((error) => {
  core.setFailed(error.message);
});
