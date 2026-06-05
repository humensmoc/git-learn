import type { AnimationEvent } from "../engine/snapshot";

export const eventLabel = (event: AnimationEvent): string => {
  switch (event.type) {
    case "CommitCreated":
      return "新增提交";
    case "RefMoved":
      return "分支指针移动";
    case "BranchCreated":
      return "创建分支";
    case "MergeHappened":
      return "合并完成";
    case "RemotePushed":
      return "推送远端";
    case "CheckoutSwitched":
      return "切换分支";
    default:
      return "仓库更新";
  }
};

