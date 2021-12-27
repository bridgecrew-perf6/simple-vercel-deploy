import * as github from "@actions/github";
import { context } from "@actions/github/lib/utils";
import { inputs } from "./inputs";

export const isomorphicSha = context.payload.pull_request
  ? context.payload.pull_request.head.sha
  : context.sha;
export const octokit = github.getOctokit(inputs.githubToken);
