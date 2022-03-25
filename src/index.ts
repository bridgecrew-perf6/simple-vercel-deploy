import * as core from "@actions/core";
import { createOrUpdateComment } from "./createOrUpdateComment";
import { inputs } from "./inputs";
import { vercelDeploy } from "./vercelDeploy";
import { vercelDeployWithRest } from "./vercelDeployWithRest";
import { vercelGetDeploy } from "./vercelGetDeploy";

const main = async () => {
  const deploymentUrl = inputs.usesRestApi
    ? await vercelDeployWithRest()
    : await vercelDeploy();
  if (deploymentUrl) {
    core.setOutput("previewUrl", deploymentUrl);
  } else {
    if (inputs.noWaitDeployment) {
      core.info("No wait deployment.");
      return;
    }
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
