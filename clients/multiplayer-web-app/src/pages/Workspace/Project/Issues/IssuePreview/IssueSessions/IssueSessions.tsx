import { memo, useMemo } from "react";
import { IDebugSession } from "@multiplayer/types";
import { useIssue } from "shared/providers/IssueContext";
import SessionsList from "shared/components/SessionsList";
import { NavigationMode, useTabs } from "shared/providers/TabsContext";

const IssueSessions = memo(() => {
  const { issue, setSelectedEvent } = useIssue();
  const { onSessionOpen } = useTabs();
  const baseFilters = useMemo(
    () => ({ issueComponentHash: issue.componentHash }),
    [issue.componentHash]
  );
  const handleRowClick = (
    {
      data,
    }: {
      type: "session";
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
  return (
    <SessionsList
      baseFilters={baseFilters}
      onRowClick={handleRowClick}
      collapseFiltersOnBase={true}
    />
  );
});

export default IssueSessions;
