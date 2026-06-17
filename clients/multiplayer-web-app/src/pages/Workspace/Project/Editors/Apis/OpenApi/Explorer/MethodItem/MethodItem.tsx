import { useOpenApi } from "shared/providers/OpenApiContext";
import PresenceAvatarGroup from "shared/components/PresenceAvatarGroup";

import Endpoint from "shared/components/Endpoint";
import ViewsCheckbox from "../ViewsCheckbox";

const MethodItem = ({ data, isActive, onOpen }) => {
  const { presenceState, getVisibilityStyles, getHighlightingStyles } =
    useOpenApi();

  return (
    <Endpoint
      id={data.key}
      path={data.path}
      isActive={isActive}
      method={data.method}
      isDeleted={data.isDeleted}
      onClick={() => onOpen(data.key)}
      leftElement={
        !data.isDeleted && (
          <ViewsCheckbox
            type="paths"
            id={data.key}
            data={data}
            changeType={data.changeType}
          />
        )
      }
      rightElement={<PresenceAvatarGroup users={presenceState[data.key]} />}
      {...getVisibilityStyles(data.changeType)}
      {...getHighlightingStyles(data.changeType)}
    />
  );
};

export default MethodItem;
