import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { IEndUser } from "@multiplayer/types";
import { Text, Box, Flex, Icon, Link } from "@chakra-ui/react";

import useMessage from "shared/hooks/useMessage";
import TimeAgo from "shared/components/TimeAgo";
import { TableSimple as Table } from "shared/components/Table";
import { getIssueEndUsers } from "shared/services/radar.service";
import { IListRes, ITableSorting } from "shared/models/interfaces";
import { SortingDirection } from "shared/models/enums";

import UsersFilters from "pages/Workspace/Project/Users/UsersFilters";
import { getCombinedUsersFilters } from "shared/providers/UsersContext";
import { UserEntityIcon } from "shared/icons";
import { useIssue } from "shared/providers/IssueContext";

const DEFAULT_LIMIT = 30;

const IssueEndUsers = memo(() => {
  const { issue } = useIssue();
  const { workspaceId, projectId, path: issueIdFromRoute } = useParams();
  const issueId = issue?._id ?? issueIdFromRoute;
  const message = useMessage();
  const scrollContainer = useRef<HTMLDivElement>();

  const [data, setData] = useState<IListRes<IEndUser>>({
    data: [],
    cursor: { total: 0, skip: 0, limit: DEFAULT_LIMIT },
  });
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({
    sorting: { key: "createdAt", direction: SortingDirection.DESC },
    skip: 0,
    limit: DEFAULT_LIMIT,
    company: "",
    tags: [],
    lastSeen: undefined,
    status: undefined,
  });

  const fetchData = useCallback(async () => {
    if (!workspaceId || !projectId || !issueId) return;
    try {
      setLoading(true);
      const filters = getCombinedUsersFilters(params);

      const res = await getIssueEndUsers(
        workspaceId,
        projectId,
        issueId,
        filters
      );
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

  const onScrollEnd = useCallback(() => {
    if (loading) return;
    if (params.skip + params.limit < (data.cursor?.total || 0)) {
      setParams((prev) => ({ ...prev, skip: prev.skip + prev.limit }));
    }
  }, [loading, params.skip, params.limit, data.cursor?.total]);

  const handleSortingChange = useCallback((sorting: ITableSorting | null) => {
    setParams((prev) => ({ ...prev, skip: 0, sorting }));
  }, []);

  return (
    <Flex direction="column" gap="4" ref={scrollContainer}>
      <UsersFilters
        filters={params}
        setFilters={setParams}
        tableData={data.data}
      />
      <Table
        data={data.data}
        columns={columns}
        loading={loading}
        pageParams={params}
        sorting={params.sorting}
        useInfiniteScrolling={true}
        onScrollEnd={onScrollEnd}
        onSortingChange={handleSortingChange}
        totalItemsCount={data.cursor.total}
        noDataText="No end users found for this issue"
      />
    </Flex>
  );
});

const columns = [
  {
    field: "name",
    sortable: true,
    name: "Name",
    component: ({ attributes, online, _id, workspace, project }) => {
      const to =
        workspace && project
          ? `/project/${workspace}/${project}/default/users/user/${_id}`
          : "";

      return (
        <Link href={to} target="_blank">
          <Flex gap="2" alignItems="center">
            <Box position="relative">
              <Icon as={UserEntityIcon} boxSize={6} />
              {online && (
                <Box
                  position="absolute"
                  width="9px"
                  height="9px"
                  border="1px solid white"
                  right="-2px"
                  top="-2px"
                  borderRadius="50%"
                  backgroundColor="green.400"
                />
              )}
            </Box>
            {attributes.name}
          </Flex>
        </Link>
      );
    },
  },
  {
    field: "email",
    sortable: false,
    name: "Email",
    component: ({ attributes }) => (
      <Text title={attributes.userEmail}>{attributes.userEmail}</Text>
    ),
  },
  {
    field: "organization",
    sortable: true,
    name: "Organization",
    width: "120px",
    component: ({ attributes }) => <Text>{attributes.orgName}</Text>,
  },
  {
    field: "lastSeen",
    name: "Last seen",
    sortable: true,
    minWidth: "140px",
    component: ({ lastSeen }) => (lastSeen ? <TimeAgo date={lastSeen} /> : ""),
  },
  {
    field: "createdAt",
    name: "Created at",
    sortable: true,
    minWidth: "140px",
    component: ({ createdAt }) => <TimeAgo date={createdAt} />,
  },
];
export default IssueEndUsers;
