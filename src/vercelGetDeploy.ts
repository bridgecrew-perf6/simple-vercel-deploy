import fetch from "node-fetch";
import { inputs } from "./inputs";

export const vercelGetDeploy = async (
  deploymentUrl: string
): Promise<{ projectName: string; inspectorUrl: string }> => {
  const getRes = await fetch(
    `https://api.vercel.com/v13/deployments/${deploymentUrl.replace(
      "https://",
      ""
    )}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${inputs.vercelToken}` },
    }
  );
  const res = await getRes.json();
  return {
    projectName: res.name,
    inspectorUrl: res.inspectorUrl,
  };
};
