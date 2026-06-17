import { AvatarGroup } from "@chakra-ui/react";
import { useEffect } from "react";
import WorkspaceUserAvatar from "shared/components/WorkspaceUserAvatar";
import { useChangesContext } from "shared/providers/ChangesContext";
import { useMultiplayerStateContext } from "shared/providers/MultiplayerStateContext";

const ChangesPresenceUsers = () => {
  const { selected } = useChangesContext();
  const { provider, clients } = useMultiplayerStateContext();

  useEffect(() => {
    provider.awareness.setLocalStateField("selectedEntity", selected);
  }, [selected]);

  return (
    <AvatarGroup size="sm" max={4} ml="auto" spacing="-0.45rem">
      {clients.map(({ user, selectedEntity }) =>
        selectedEntity === selected ? (
          <WorkspaceUserAvatar
            user={user}
            key={user._id}
            userSelect="none"
            borderColor={user.color}
          />
        ) : null
      )}
    </AvatarGroup>
  );
};

export default ChangesPresenceUsers;
