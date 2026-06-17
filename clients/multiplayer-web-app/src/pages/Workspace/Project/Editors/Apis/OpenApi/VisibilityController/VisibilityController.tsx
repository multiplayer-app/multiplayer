import { EntityCommitChangeType } from "@multiplayer/types";
import { ChangesViewMode } from "shared/models/enums";
import { useApis } from "shared/providers/ApisContext";
import { useOpenApi } from "shared/providers/OpenApiContext";

interface VisibilityControllerProps {
  children: any;
  changeType: EntityCommitChangeType;
}

const VisibilityController = ({
  children,
  changeType,
}: VisibilityControllerProps) => {
  const { highlightingMode } = useApis();
  const { getVisibility } = useOpenApi();
  if (
    (highlightingMode === ChangesViewMode.NONE &&
      changeType === EntityCommitChangeType.DELETE) ||
    !getVisibility(changeType)
  )
    return null;

  return children;
};

export default VisibilityController;
