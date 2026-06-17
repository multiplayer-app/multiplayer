import { memo, useMemo } from "react";
import { Checkbox } from "@chakra-ui/react";
import { createPortal } from "react-dom";
import { IDebugSessionNode } from "../../../types";
import { determineParentState } from "../../../utils";
import { useDebugSession } from "../../../DebugSessionContext";

interface CheckAllPortalProps<T> {
  nodes: IDebugSessionNode<T>[];
}

const CheckAllPortal = <T,>({ nodes }: CheckAllPortalProps<T>) => {
  const { checkedNodes, updateCheckedNodesForRoots, currentViewComponents } =
    useDebugSession();

  const portal = useMemo(() => {
    const container = document.getElementById("check-all-portal");
    if (!container || !nodes?.length || currentViewComponents) return null;

    const allChecked = nodes.every(
      (n) => determineParentState(n, checkedNodes) === "checked"
    );
    const isIndeterminate =
      nodes.some(
        (n) => determineParentState(n, checkedNodes) !== "unchecked"
      ) && !allChecked;

    return createPortal(
      <Checkbox
        bg="bg.primary"
        display="flex"
        isChecked={allChecked}
        isIndeterminate={isIndeterminate}
        onChange={(e) => updateCheckedNodesForRoots(nodes, e.target.checked)}
      ></Checkbox>,
      container
    );
  }, [nodes, checkedNodes, currentViewComponents, updateCheckedNodesForRoots]);

  return portal;
};

export default memo(CheckAllPortal);
