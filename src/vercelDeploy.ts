import * as core from "@actions/core";
import { exec } from "@actions/exec";
import { context } from "@actions/github/lib/utils";
import { isomorphicSha, octokit } from "./globals";
import { inputs } from "./inputs";
import { getBranchName } from "./getBranchName";
import { getRepo } from "./getRepo";

export const vercelDeploy = async (): Promise<string | null> => {
  const branchName = getBranchName();

  let message;
  if (context.payload.pull_request) {
    const res = await octokit.rest.repos.getCommit({
      ...context.repo,
      ref: context.payload.pull_request.head.ref,
    });
    message = res.data.commit.message;
  } else if (context.payload.head_commit) {
    message = context.payload.head_commit.message;
  } else {
    message = `Deploy ${isomorphicSha}`;
  }

  let outstr = "";
  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        outstr += data.toString();
        core.info(data.toString());
      },
      stderr: (data: Buffer) => {
        core.info(data.toString());
      },
    },
    env: {
      ...process.env,
      VERCEL_ORG_ID: inputs.vercelOrgId,
      VERCEL_PROJECT_ID: inputs.vercelProjectId,
    },
  };

  const repo = await getRepo();
  const args = [
    "vercel",
    ...(inputs.isProduction ? ["--prod"] : []),
    "-t",
    inputs.vercelToken,
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
    `githubCommitRepoId=${repo.id}`,
    "-m",
    `githubCommitSha=${isomorphicSha}`,
    "-m",
    "githubDeployment=1",
    "-m",
    `githubOrg=${context.repo.owner}`,
    "-m",
    `githubRepo=${context.repo.repo}`,
    "-m",
    `githubRepoId=${repo.id}`,
    "-m",
    `githubCommitAuthorLogin=${context.actor}`,
  ];

  if (inputs.noWaitDeployment) {
    exec("npx", args, { env: options.env });
    return null;
  } else {
    await exec("npx", args, options);
  }

  return outstr;
};
