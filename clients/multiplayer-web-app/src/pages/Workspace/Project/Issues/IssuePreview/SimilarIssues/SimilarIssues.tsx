import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { Flex } from "@chakra-ui/react";

import { TableSimple as Table } from "shared/components/Table";
import TimeAgo from "shared/components/TimeAgo";
import { SeverityBadge } from "../../Severity";

import { IIssue } from "@multiplayer/types";
import { IListRes, ITableSorting } from "shared/models/interfaces";
import { useIssuesFilters } from "shared/hooks/useIssuesFilters";
import { getCombinedIssuesFilters } from "shared/hooks/useIssuesFilters";
import { getGroupIssues } from "shared/services/radar.service";
import useLocalStorage from "shared/hooks/useLocalStorage";
import IssuesFilters from "../../IssuesFilters";
import { useIssue } from "shared/providers/IssueContext";
import IssueInfo from "shared/components/IssueInfo";
import { ISSUE_HASH_KEY } from "shared/configs/issues.configs";

const SimilarIssues = memo(() => {
  const { issue } = useIssue();
  const { setSelectedEvent } = useIssue();
  const { filters, setFilters } = useIssuesFilters();
  const { workspaceId, projectId, path: issueId } = useParams();
  const scrollContainer = useRef<HTMLDivElement>();
  const [issues, setIssues] = useLocalStorage<IListRes<IIssue>>(
    "similarIssues",
    {
      data: [],
      cursor: { total: 0, skip: 0, limit: 20 },
    }
  );

  const [loading, setLoading] = useLocalStorage<boolean>(
    "similarIssuesLoading",
    false
  );
  const hash = issue?.[ISSUE_HASH_KEY];
  const fetchIssues = useCallback(async () => {
    if (!workspaceId || !projectId || !issueId) return;
    try {
      setLoading(true);

      const params = getCombinedIssuesFilters(filters, [
        "groupBy",
        "metrics.from",
        "metrics.to",
        "metrics.granularity",
      ]);
      const res = await getGroupIssues(workspaceId, projectId, {
        ...params,
        [ISSUE_HASH_KEY]: hash,
      });
      setIssues((prev) => ({
        cursor: res.cursor,
        data: filters.skip ? [...prev.data, ...res.data] : res.data,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, issueId, filters, setIssues, setLoading, hash]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleScrollEnd = useCallback(() => {
    if (loading) return;
    const { skip = 0, limit = 30 } = filters || {};
    if (skip + limit >= (issues?.cursor?.total || 0)) return;
    setFilters((prev) => ({ ...prev, skip: skip + limit }));
  }, [loading, filters, issues?.cursor?.total, setFilters]);

  const columns = useMemo(
    () => [
      {
        field: "title",
        name: "Issue",
        minWidth: "260px",
        sortable: true,
        component: (issue: IIssue) => <IssueInfo issue={issue} />,
      },
      {
        field: "lastSeen",
        name: "Last seen",
        minWidth: "130px",
        sortable: true,
        component: ({ lastSeen }) => <TimeAgo date={lastSeen} />,
      },
      {
        field: "severity",
        name: "Severity",
        minWidth: "120px",
        sortable: true,
        component: ({ severity }) => <SeverityBadge value={severity} />,
      },
    ],
    []
  );

  const handleRowClick = (row: IIssue) => {
    setSelectedEvent({ type: "issue", data: row });
  };

  const handleSortingChange = (sorting: ITableSorting) => {
    setFilters((p) => ({ ...p, sorting, skip: 0 }));
  };

  return (
    <Flex direction="column" gap="4" ref={scrollContainer}>
      <IssuesFilters filters={filters} setFilters={setFilters} />
      <Table
        data={issues.data}
        columns={columns}
        loading={loading}
        tableName="similarIssues"
        useInfiniteScrolling={true}
        pageParams={{ skip: filters.skip || 0, limit: filters.limit || 30 }}
        totalItemsCount={issues.cursor.total}
        noDataText={"No similar issues found"}
        sorting={filters.sorting}
        onRowClick={handleRowClick}
        onScrollEnd={handleScrollEnd}
        onSortingChange={handleSortingChange}
      />
    </Flex>
  );
});

export default SimilarIssues;
