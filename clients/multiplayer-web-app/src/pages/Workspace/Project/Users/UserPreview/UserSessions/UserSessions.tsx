import { useMemo } from "react";
import { IDebugSession } from "@multiplayer/types";
import SessionsList from "shared/components/SessionsList";
import { useUser } from "shared/providers/UserContext";
import { NavigationMode, useTabs } from "shared/providers/TabsContext";

const UserSessions = () => {
  const { user, setSelectedEvent } = useUser();
  const { onSessionOpen } = useTabs();
  const handleRowClick = (
    {
      data,
    }: {
      type: string;
      data: IDebugSession;
    },
    e: React.MouseEvent<HTMLTableRowElement>
  ) => {
    if (e.metaKey || e.ctrlKey) {
      onSessionOpen(data, NavigationMode.TABS);
    } else {
      setSelectedEvent({ type: "session", data });
    }
  };

  const baseFilters = useMemo(
    () => ({
      endUserHash: user?.data?.hash,
    }),
    [user?.data?.hash]
  );

  return (
    <SessionsList
      baseFilters={baseFilters}
      onRowClick={handleRowClick}
      user={user.data}
    />
  );
};

export default UserSessions;
