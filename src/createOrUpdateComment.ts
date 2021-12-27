import * as core from "@actions/core";
import { context } from "@actions/github/lib/utils";
import { isomorphicSha, octokit } from "./globals";

const buildComment = async ({
  titleText,
  deploymentUrl,
  inspectorUrl,
}: {
  titleText: string;
  deploymentUrl: string;
  inspectorUrl: string;
}) => {
  return `${titleText}

🔍 Inspect: ${inspectorUrl}
✅ Preview: ${deploymentUrl}

Built with commit ${isomorphicSha}.`;
};

export const createOrUpdateComment = async ({
  deploymentUrl,
  deployInfo,
}: {
  deploymentUrl: string;
  deployInfo: { projectName: string; inspectorUrl: string };
}) => {
  const titleText = `Deployment preview for _${deployInfo.projectName}_.`;
  if (context.eventName === "pull_request") {
    const res = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: context.issue.number,
    });
    const comment = res.data.find((v) => v.body?.includes(titleText));
    const commentId = comment && comment.id;
    if (commentId) {
      await octokit.rest.issues.updateComment({
        ...context.repo,
        comment_id: commentId,
        body: await buildComment({
          titleText,
          deploymentUrl,
          inspectorUrl: deployInfo.inspectorUrl,
        }),
      });
    } else {
      await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: context.issue.number,
        body: await buildComment({
          titleText,
          deploymentUrl,
          inspectorUrl: deployInfo.inspectorUrl,
        }),
      });
    }
  } else if (context.eventName === "push") {
    // コミットコメントの更新に失敗するため更新はなし
    await octokit.rest.repos.createCommitComment({
      ...context.repo,
      commit_sha: context.sha,
      body: await buildComment({
        titleText,
        deploymentUrl,
        inspectorUrl: deployInfo.inspectorUrl,
      }),
    });
  } else {
    core.info("Github comment is skipped.");
  }
};