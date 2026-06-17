import { Box, Checkbox } from "@chakra-ui/react";
import { IDebugSessionNode } from "../../../types";
import { determineParentState } from "../../../utils";
import { useDebugSession } from "../../../DebugSessionContext";

interface ViewsCheckboxProps<T> {
  node: IDebugSessionNode<T>;
}
const ViewsCheckbox = <T,>({ node }: ViewsCheckboxProps<T>) => {
  const { checkedNodes, currentViewComponents, updateCheckedNodes } =
    useDebugSession();
  if (currentViewComponents) return null;

  const parentState = determineParentState(node, checkedNodes);

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      <Checkbox
        verticalAlign="sub"
        id={node.id}
        isChecked={parentState === "checked"}
        isIndeterminate={parentState === "indeterminate"}
        onChange={(e) => updateCheckedNodes(e, node)}
      />
    </Box>
  );
};

export default ViewsCheckbox;
