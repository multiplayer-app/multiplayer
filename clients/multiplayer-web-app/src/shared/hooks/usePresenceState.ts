import { useCallback, useEffect, useState } from "react";
import {
  ClientState,
  IPresentUser,
  IUserPresenceState,
} from "shared/models/interfaces";
import { getClientUserName } from "shared/helpers/general.helpers";

const usePresenceState = (clients: ClientState[]) => {
  const [presenceState, setPresenceState] = useState<IUserPresenceState>({});

  useEffect(() => {
    const newPresenceState: IUserPresenceState = {};
    clients
      .filter((c) => c.user?._id)
      .forEach((c) => {
        const user = c.user!;
        const presentUser: IPresentUser = {
          id: user._id,
          name: getClientUserName(user),
          avatar: user.iconUrl,
          color: user.color,
        };

        if (c.focusedElement) {
          if (!newPresenceState[c.focusedElement]) {
            newPresenceState[c.focusedElement] = [];
          }
          newPresenceState[c.focusedElement].push(presentUser);
        }
      });

    setPresenceState(newPresenceState);
  }, [clients]);

  const getPresentUsers = useCallback(
    (formControlName: string) => {
      return presenceState && presenceState[formControlName]
        ? presenceState[formControlName]
        : [];
    },
    [presenceState]
  );

  return { presenceState, getPresentUsers };
};

export default usePresenceState;
