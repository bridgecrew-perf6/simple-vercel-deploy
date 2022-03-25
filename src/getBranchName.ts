import { context } from "@actions/github";

export const getBranchName = (): string => {
  let branchName;
  if (context.payload.pull_request) {
    branchName = context.payload.pull_request.head.ref;
  } else if (context.ref) {
    branchName = context.ref.replace("refs/heads/", "");
  } else {
    throw new Error("Branch name is undefined.");
  }
  return branchName;
};
