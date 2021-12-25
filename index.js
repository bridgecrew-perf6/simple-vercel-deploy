const core = require("@actions/core");
const { exec } = require("@actions/exec");
const github = require("@actions/github");

const main = async () => {
  const isProduction = core.getInput("is-production") === "true";

  const { GITHUB_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, VERCEL_TOKEN } =
    process.env;

  core.exportVariable("VERCEL_ORG_ID", VERCEL_ORG_ID);
  core.exportVariable("VERCEL_PROJECT_ID", VERCEL_PROJECT_ID);

  const { context } = github;
  // console.log(JSON.stringify(github));

  let branchName;
  if (context.ref) {
    branchName = context.ref.replace("refs/heads/", "");
  } else if (context.payload.pull_request) {
    branchName = context.payload.pull_request.head.ref;
  } else {
    throw new Error("Branch name is undefined.");
  }
  // console.log(branchName);

  const options = {};
  options.listeners = {
    stdout: (data) => {
      // eslint-disable-next-line no-unused-vars
      myOutput += data.toString();
      core.info(data.toString());
    },
    stderr: (data) => {
      myError += data.toString();
      core.info(data.toString());
    },
  };
  // await exec(
  //   "npx",
  //   [
  //     "vercel",
  //     ...(isProduction ? ["--prod"] : []),
  //     "-t",
  //     VERCEL_TOKEN,
  //     "-m",
  //     `githubCommitAuthorName=${context.actor}`,
  //     "-m",
  //     `githubCommitMessage=${context.payload.pull_request.title}`,
  //     "-m",
  //     `githubCommitOrg=${context.repo.owner}`,
  //     "-m",
  //     `githubCommitRef=${branchName}`,
  //     "-m",
  //     `githubCommitRepo=${context.repo.repo}`,
  //     "-m",
  //     `githubCommitRepoId=${context.repo.id}`,
  //     "-m",
  //     `githubCommitSha=${context.sha}`,
  //     "-m",
  //     "githubDeployment=1",
  //     "-m",
  //     `githubOrg=${context.repo.owner}`,
  //     "-m",
  //     `githubRepo=${context.repo.repo}`,
  //     "-m",
  //     `githubRepoId=${context.repo.id}`,
  //     "-m",
  //     `githubCommitAuthorLogin=${context.actor}`,
  //   ],
  //   options
  // );

  const octokit = github.getOctokit(GITHUB_TOKEN);

  if (context.eventName === "pull_request") {
    const res = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: context.issue.number,
    });
    const comment = res.data.find((v) => v.body.includes("test comment"));
    const commentId = comment && comment.id;
    if (commentId) {
      await octokit.rest.issues.updateComment({
        ...context.repo,
        comment_id: commentId,
        body: "test comment",
      });
    } else {
      await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: context.issue.number,
        body: "test comment",
      });
    }
  } else {
    const res = await octokit.rest.repos.listCommentsForCommit({
      ...context.repo,
      commit_sha: context.sha,
    });
    const comment = res.data.find((v) => v.body.includes("test comment"));
    const commentId = comment && comment.id;
    if (commentId) {
      await octokit.rest.repos.updateCommitComment({
        ...context.repo,
        comment_id: commentId,
        body: "test comment",
      });
    } else {
      await octokit.rest.repos.createCommitComment({
        ...context.repo,
        commit_sha: context.sha,
        body: "test comment",
      });
    }
  }
};
main().catch((error) => {
  core.setFailed(error.message);
});
