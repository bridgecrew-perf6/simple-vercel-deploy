import * as core from "@actions/core";
import { createOrUpdateComment } from "./createOrUpdateComment";
import { inputs } from "./inputs";
import { vercelDeploy } from "./vercelDeploy";
import { vercelGetDeploy } from "./vercelGetDeploy";

const main = async () => {
  core.exportVariable("VERCEL_ORG_ID", inputs.vercelOrgId);
  core.exportVariable("VERCEL_PROJECT_ID", inputs.vercelProjectId);

  const deploymentUrl = await vercelDeploy();
  if (deploymentUrl) {
    core.setOutput("previewUrl", deploymentUrl);
  } else {
    throw new Error("previewUrl is undefined");
  }

  const deploymentInfo = await vercelGetDeploy(deploymentUrl);

  if (inputs.creatsGithubComment) {
    await createOrUpdateComment({ deploymentUrl, deployInfo: deploymentInfo });
  } else {
    core.info("Github comment is skipped.");
  }
};
main().catch((error) => {
  core.setFailed(error.message);
});
