import * as core from "@actions/core";
import { exec } from "@actions/exec";
import { context } from "@actions/github/lib/utils";
import github from "@actions/github";
import { isomorphicSha, octokit } from "./globals";
import { inputs } from "./inputs";

export const vercelDeploy = async (): Promise<string> => {
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
    }
  };

  const repoId = (context.repo as any).id as number;
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
    `githubCommitRepoId=${repoId}`,
    "-m",
    `githubCommitSha=${isomorphicSha}`,
    "-m",
    "githubDeployment=1",
    "-m",
    `githubOrg=${context.repo.owner}`,
    "-m",
    `githubRepo=${context.repo.repo}`,
    "-m",
    `githubRepoId=${repoId}`,
    "-m",
    `githubCommitAuthorLogin=${context.actor}`,
  ];
  await exec("npx", args, options);
  return outstr;
};
