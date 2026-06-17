import { memo } from "react";
import { useDebugSession } from "pages/Workspace/Project/Debugger/DebugSession/DebugSessionContext";
import CollapseToggleButton from "shared/components/CollapseToggleButton";

const DebugNodeCollapseToggle = ({ node }) => {
  const { isNodeExpanded, toggleCollapsed } = useDebugSession();

  const expanded = isNodeExpanded(node.id);

  if (!node.childSpans.length) {
    return null;
  }

  return (
    <CollapseToggleButton
      collapsed={!expanded}
      onToggle={() => toggleCollapsed(node.id)}
    />
  );
};

export default memo(DebugNodeCollapseToggle);
