const core = require("@actions/core");
const { exec } = require("@actions/exec");
const github = require("@actions/github");

const main = async () => {
  const isProduction = core.getInput("is-production") === "true";

  const { VERCEL_ORG_ID, VERCEL_PROJECT_ID, VERCEL_TOKEN } = process.env;

  core.exportVariable("VERCEL_ORG_ID", VERCEL_ORG_ID);
  core.exportVariable("VERCEL_PROJECT_ID", VERCEL_PROJECT_ID);

  const { context } = github;
  console.log(JSON.stringify(github));

  let branchName;
  if (context.ref) {
    branchName = context.ref.replace("refs/heads/", "");
  } else if (context.payload.pull_request) {
    branchName = context.payload.pull_request.head.ref;
  } else {
    throw new Error("Branch name is undefined.");
  }
  console.log(branchName);

  // await exec("npx", [
  //   "vercel",
  //   ...(isProduction ? ["--prod"] : []),
  //   "-t",
  //   VERCEL_TOKEN,
  //   "-m",
  //   `githubCommitAuthorName=${context.actor}`,
  //   "-m",
  //   `githubCommitMessage=${context.payload.pull_request.title}`,
  //   "-m",
  //   `githubCommitOrg=${context.repo.owner}`,
  //   "-m",
  //   `githubCommitRef=${branchName}`,
  //   "-m",
  //   `githubCommitRepo=${context.repo.repo}`,
  //   "-m",
  //   `githubCommitRepoId=${context.repo.id}`,
  //   "-m",
  //   `githubCommitSha=${context.sha}`,
  //   "-m",
  //   "githubDeployment=1",
  //   "-m",
  //   `githubOrg=${context.repo.owner}`,
  //   "-m",
  //   `githubRepo=${context.repo.repo}`,
  //   "-m",
  //   `githubRepoId=${context.repo.id}`,
  //   "-m",
  //   `githubCommitAuthorLogin=${context.actor}`,
  // ]);
};
main().catch((error) => {
  core.setFailed(error.message);
});
