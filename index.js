const core = require("@actions/core");
const { exec } = require("@actions/exec");
const github = require("@actions/github");

const buildComment = ({ titleText, deploymentUrl, context }) => `${titleText}
Preview ${deploymentUrl}
Built with commit ${context.sha}.`;

const main = async () => {
  const isProduction = core.getInput("is-production") === "true";

  const { GITHUB_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, VERCEL_TOKEN } =
    process.env;

  core.exportVariable("VERCEL_ORG_ID", VERCEL_ORG_ID);
  core.exportVariable("VERCEL_PROJECT_ID", VERCEL_PROJECT_ID);

  const { context } = github;
  core.info(JSON.stringify(github));

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
  await exec(
    "npx",
    [
      "vercel",
      ...(isProduction ? ["--prod"] : []),
      "-t",
      VERCEL_TOKEN,
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
    ],
    options
  );

  const deploymentUrl = myOutput;
  if (deploymentUrl) {
    core.setOutput("preview-url", deploymentUrl);
  } else {
    throw new Error("preview-url is undefined");
  }

  const titleText = `Deployment ready for ${context.payload.repository.name}.`;

  const octokit = github.getOctokit(GITHUB_TOKEN);
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
        body: buildComment({ titleText, deploymentUrl, context }),
      });
    } else {
      await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: context.issue.number,
        body: buildComment({ titleText, deploymentUrl, context }),
      });
    }
  } else {
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
        body: buildComment({ titleText, deploymentUrl, context }),
      });
    } else {
      await octokit.rest.repos.createCommitComment({
        ...context.repo,
        commit_sha: context.sha,
        body: buildComment({ titleText, deploymentUrl, context }),
      });
    }
  }
};
main().catch((error) => {
  core.setFailed(error.message);
});
