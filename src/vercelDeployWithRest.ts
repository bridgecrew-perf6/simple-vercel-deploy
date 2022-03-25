import { context } from "@actions/github";
import fetch from "node-fetch";
import { getBranchName } from "./getBranchName";
import { getRepo } from "./getRepo";
import { isomorphicSha } from "./globals";
import { inputs } from "./inputs";

export const vercelDeployWithRest = async (): Promise<string> => {
  const { id } = await getRepo();
  const branchName = getBranchName();
  const getRes = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: { Authorization: `Bearer ${inputs.vercelToken}` },
    body: JSON.stringify({
      name: context.repo.repo,
      gitSource: {
        type: "github",
        ref: branchName,
        sha: isomorphicSha,
        repoId: id,
      },
      target: inputs.isProduction ? "production" : undefined,
    }),
  });
  if (!getRes.ok) {
    throw new Error("Fetching deployment api is failed.");
  }
  const res = await getRes.json();
  return "https://" + res.url;
};
