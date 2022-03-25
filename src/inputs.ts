import * as core from "@actions/core";

export const inputs = {
  githubToken: core.getInput("github-token"),
  vercelToken: core.getInput("vercel-token"),
  vercelOrgId: core.getInput("vercel-org-id"),
  vercelProjectId: core.getInput("vercel-project-id"),
  isProduction: core.getInput("is-production") === "true",
  creatsGithubComment: core.getInput("github-comment") !== "false",
  usesRestApi: core.getInput("uses-rest-api") === "true",
};
