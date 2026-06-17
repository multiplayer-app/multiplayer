import { useMemo, useState } from "react";
import { IconButton, Icon } from "@chakra-ui/react";
import { StarFilledIcon, StarIcon } from "shared/icons";
import { useDebugSession } from "../../../DebugSessionContext";
import { IDebugSessionNode } from "../../../types";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

const StarToggleButton = ({ node, readonly = false }) => {
  const [loading, setLoading] = useState(false);
  const { starredNodes, toggleSessionNodeStar } = useDebugSession();
  const { withSandboxCheck } = useProjectSandbox();

  const onToggle = async (e) => {
    e.stopPropagation();
    if (readonly) return;
    setLoading(true);
    await toggleSessionNodeStar(node.id);
    setLoading(false);
  };

  const staredState = useMemo(() => {
    if (starredNodes.has(node.id)) {
      return 1;
    }
    if (node.childSpans?.length) {
      return hasStarredChildren(node, starredNodes) ? 2 : 0;
    }
  }, [node, starredNodes]);

  return (
    <IconButton
      size="xs"
      variant="base"
      aria-label="star"
      isLoading={loading}
      icon={
        staredState === 1 ? (
          <Icon as={StarFilledIcon} color="yellow.500" boxSize="22px" />
        ) : (
          <Icon
            as={StarIcon}
            color={staredState === 2 ? "yellow.500" : "muted"}
            className="start-icon"
          />
        )
      }
      onClick={withSandboxCheck(onToggle)}
      isDisabled={readonly}
      _disabled={{ opacity: 1, cursor: "default" }}
    />
  );
};

function hasStarredChildren<T>(
  node: IDebugSessionNode<any>,
  starredNodes: Set<string>
): boolean {
  if (!node.childSpans || node.childSpans.length === 0) {
    return false; // No children, so can't have starred children
  }

  for (const child of node.childSpans) {
    if (starredNodes.has(child.id) || hasStarredChildren(child, starredNodes)) {
      return true; // Found a starred child or a descendant with a starred child
    }
  }

  return false; // No starred children found in this subtree
}
export default StarToggleButton;
