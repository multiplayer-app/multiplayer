import { Box, Checkbox } from "@chakra-ui/react";
import { EntityCommitChangeType } from "@multiplayer/types";
import { useApis } from "shared/providers/ApisContext";
import { useOpenApi } from "shared/providers/OpenApiContext";

interface ViewsCheckboxProps {
  id?: string;
  data: any;
  isDisabled?: boolean;
  changeType: EntityCommitChangeType;
  type?: "tags" | "paths" | "components";
}

const ViewsCheckbox = ({
  id,
  type,
  data,
  changeType,
  isDisabled,
}: ViewsCheckboxProps) => {
  const { readonly, isDynamicView, checkedNodes, onSelectionChange } =
    useApis();
  const { isRadarView, onSelectionToggle } = useOpenApi();

  if ((isDynamicView || readonly) && !onSelectionChange) return null;

  const disabled = isDisabled || !type || !id || (isRadarView && !changeType);
  const isChecked = disabled ? false : checkedNodes[type][id] === 1;
  const isIndeterminate = checkedNodes[type][id] === 2;

  return (
    <Box onClick={(e) => e.stopPropagation()} w="4">
      <Checkbox
        p="2"
        m="-2"
        userSelect="none"
        verticalAlign="middle"
        borderColor="blackAlpha.300"
        isChecked={isChecked}
        isDisabled={disabled}
        isIndeterminate={isIndeterminate}
        onChange={(e) => onSelectionToggle(e.target.checked, type, id)}
      />
    </Box>
  );
};

export default ViewsCheckbox;
