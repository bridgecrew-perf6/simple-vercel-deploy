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

  const messageBody = await buildComment({
    titleText,
    deploymentUrl,
    inspectorUrl: deployInfo.inspectorUrl,
  });

  if (context.eventName === "pull_request") {
    // get previous comment
    const res = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: context.issue.number,
    });
    const comment = res.data.find((v) => v.body?.includes(titleText));
    const commentId = comment && comment.id;

    // update
    if (commentId) {
      try {
        await octokit.rest.issues.updateComment({
          ...context.repo,
          comment_id: commentId,
          body: messageBody,
        });
        return;
      } catch (err: unknown) {
        if (
          (err as { message: string }).message?.includes(
            "commit_id has been locked"
          )
        ) {
          // ロックされていたら作成に移る
        } else {
          throw err;
        }
      }
    }

    // create
    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: context.issue.number,
      body: messageBody,
    });
  } else {
    // get previous comment
    const res = await octokit.rest.repos.listCommentsForCommit({
      ...context.repo,
      commit_sha: context.sha,
    });
    const comment = res.data.find((v) => v.body.includes(titleText));
    const commentId = comment && comment.id;

    // update
    if (commentId) {
      try {
        await octokit.rest.repos.updateCommitComment({
          ...context.repo,
          comment_id: commentId,
          body: messageBody,
        });
        return;
      } catch (err: unknown) {
        if (
          (err as { message: string }).message?.includes(
            "commit_id has been locked"
          )
        ) {
          // ロックされていたら作成に移る
        } else {
          throw err;
        }
      }
    }

    // create
    await octokit.rest.repos.createCommitComment({
      ...context.repo,
      commit_sha: context.sha,
      body: messageBody,
    });
  }
};
