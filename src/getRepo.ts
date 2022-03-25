import { context } from "@actions/github";
import { octokit } from "./globals";

export const getRepo = async () => {
  const res = await octokit.rest.repos.get(context.repo);
  return res.data;
};
