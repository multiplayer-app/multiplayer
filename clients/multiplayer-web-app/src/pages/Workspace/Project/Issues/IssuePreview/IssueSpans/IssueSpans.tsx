import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { TableSimple as Table } from "shared/components/Table";
import TimeAgo from "shared/components/TimeAgo";
import MonoText from "shared/components/MonoText";

import { IListRes, ITableSorting } from "shared/models/interfaces";
import { getIssueSpans } from "shared/services/radar.service";
import useMessage from "shared/hooks/useMessage";
import { SortingDirection } from "shared/models/enums";
import Duration from "shared/components/Duration";
import { useIssue } from "shared/providers/IssueContext";
import NodeIcon from "shared/components/NodeIcon";
import { Flex } from "@chakra-ui/react";

const DEFAULT_LIMIT = 30;

const IssueSpans = memo(() => {
  const { setSelectedEvent } = useIssue();
  const { workspaceId, projectId, path: issueId } = useParams();
  const message = useMessage();
  const [data, setData] = useState<IListRes<any>>({
    data: [],
    cursor: { total: 0, skip: 0, limit: DEFAULT_LIMIT },
  });
  const [loading, setLoading] = useState(true);

  const [params, setParams] = useState({
    skip: 0,
    limit: DEFAULT_LIMIT,
    sorting: { key: "Timestamp", direction: SortingDirection.DESC },
  });

  const fetchData = useCallback(async () => {
    if (!workspaceId || !projectId || !issueId) return;
    try {
      setLoading(true);
      const { skip, limit, sorting } = params;
      const _params: any = {
        skip,
        limit,
      };
      if (sorting) {
        _params.sortKey = sorting.key;
        _params.sortDirection = sorting.direction;
      }

      const res = await getIssueSpans(workspaceId, projectId, issueId, _params);
      setData((prev) => ({
        cursor: res.cursor,
        data: params.skip ? [...prev.data, ...res.data] : res.data,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, issueId, params, message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleScrollEnd = useCallback(() => {
    if (loading) return;
    if (params.skip + params.limit < (data.cursor?.total || 0)) {
      setParams((prev) => ({ ...prev, skip: prev.skip + prev.limit }));
    }
  }, [loading, params.skip, params.limit, data.cursor?.total]);

  const handleSortingChange = useCallback((sorting: ITableSorting | null) => {
    setParams((prev) => ({ ...prev, skip: 0, sorting }));
  }, []);

  const columns = useMemo(
    () => [
      {
        field: "SpanName",
        name: "Event",
        minWidth: "260px",
        maxWidth: "280px",
        sortable: true,
        component: ({ SpanName, StatusMessage }) => (
          <MonoText noOfLines={1}>
            {SpanName} {StatusMessage ? `- ${StatusMessage}` : ""}
          </MonoText>
        ),
      },
      {
        field: "ServiceName",
        name: "Component",
        minWidth: "180px",
        sortable: true,
        component: ({ ServiceName }) => (
          <Flex alignItems="center" gap={1}>
            <NodeIcon type={ServiceName} />
            {ServiceName}
          </Flex>
        ),
      },
      {
        field: "StatusCode",
        name: "Status",
        minWidth: "100px",
        sortable: true,
        component: ({ StatusCode }) => <>{StatusCode || "OK"}</>,
      },
      {
        field: "Duration",
        name: "Duration",
        minWidth: "110px",
        sortable: true,
        component: ({ Duration: duration }) => <Duration data={duration} />,
      },
      {
        field: "Timestamp",
        name: "Time",
        sortable: true,
        minWidth: "150px",
        component: ({ Timestamp }) => <TimeAgo date={Timestamp} />,
      },
    ],
    []
  );

  const handleRowClick = (row: any) => {
    setSelectedEvent({ type: "span", data: row });
  };

  return (
    <Table
      data={data.data}
      columns={columns}
      loading={loading}
      pageParams={params}
      sorting={params.sorting}
      useInfiniteScrolling={true}
      totalItemsCount={data.cursor.total}
      onRowClick={handleRowClick}
      onScrollEnd={handleScrollEnd}
      onSortingChange={handleSortingChange}
      noDataText="No events found for this issue"
    />
  );
});

export default IssueSpans;
