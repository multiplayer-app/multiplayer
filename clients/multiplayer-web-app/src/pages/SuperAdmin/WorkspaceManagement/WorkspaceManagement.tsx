import { IWorkspace } from "@multiplayer/types";
import { Flex, Text, Badge, useDisclosure, Box } from "@chakra-ui/react";
import { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";

import Tag from "shared/components/Tag";
import Table from "shared/components/Table";
import TimeAgo from "shared/components/TimeAgo";
import useMessage from "shared/hooks/useMessage";
import DebounceSearch from "shared/components/DebounceSearch";

import { SortingDirection } from "shared/models/enums";
import {
  getAllWorkspaces,
  deleteWorkspace,
} from "shared/services/workspace.service";

import WorkspaceManagerModal from "./WorkspaceManagerModal";
import AuthorizeSessionSelect from "shared/components/AuthorizeSessionSelect";

interface WorkspaceManagementProps {}

const WorkspaceManagement = memo((_props: WorkspaceManagementProps) => {
  const message = useMessage();
  const scrollContainer = useRef<HTMLDivElement>();
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedWorkspace, setSelectedWorkspace] = useState<IWorkspace | null>(
    null
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [filters, setFilters] = useState({
    query: "",
    sorting: null as { key: string; direction: SortingDirection } | null,
    params: {
      skip: 0,
      limit: 50,
    },
  });

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (filters.query) {
        params.text = filters.query;
      }

      if (filters.sorting) {
        params.sortKey = filters.sorting.key;
        params.sortDirection =
          filters.sorting.direction === SortingDirection.ASC ? 1 : -1;
      }

      // Add pagination parameters
      params.skip = filters.params.skip;
      params.limit = filters.params.limit;

      const response = await getAllWorkspaces(params);
      const newWorkspaces = response.data || [];
      const cursor = response.cursor || { total: 0 };

      if (filters.params.skip > 0) {
        setWorkspaces((prev) => [...prev, ...newWorkspaces]);
      } else {
        setWorkspaces(newWorkspaces);
      }
      setTotalCount(cursor.total);
    } catch (error) {
      message.handleError(error);
    } finally {
      setLoading(false);
    }
  }, [message, filters]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const onScrollEnd = useCallback(() => {
    if (loading) return;
    const { skip, limit } = filters.params;
    if (skip + limit < totalCount) {
      setFilters((prev) => ({
        ...prev,
        params: { ...prev.params, skip: prev.params.skip + prev.params.limit },
      }));
    }
  }, [loading, filters.params, totalCount]);

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      await deleteWorkspace(workspaceId);
      setWorkspaces((prev) =>
        prev.filter((workspace) => workspace._id !== workspaceId)
      );
      message.success("Workspace deleted successfully");
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleRowClick = (workspace: IWorkspace) => {
    setSelectedWorkspace(workspace);
    onOpen();
  };

  const handleModalClose = () => {
    onClose();
    setSelectedWorkspace(null);
  };

  const handleWorkspaceUpdate = (updatedWorkspace: IWorkspace) => {
    setSelectedWorkspace(updatedWorkspace);
    setWorkspaces((prev) =>
      prev.map((workspace) =>
        workspace._id === updatedWorkspace._id
          ? { ...workspace, ...updatedWorkspace }
          : workspace
      )
    );
  };

  const handleSortingChange = useCallback((newSorting: any) => {
    setFilters((prev) => ({
      ...prev,
      sorting: newSorting,
      params: { ...prev.params, skip: 0 },
    }));
  }, []);

  const handleQueryChange = useCallback((newQuery: string) => {
    setFilters((prev) => ({
      ...prev,
      query: newQuery,
      params: { ...prev.params, skip: 0 },
    }));
  }, []);

  const columns = useMemo(
    () => [
      {
        field: "name",
        name: "Name",
        sortable: true,
        component: ({ name, archived }) => (
          <Flex alignItems="center" gap={2}>
            <Text fontWeight="500">{name || "Unnamed Workspace"}</Text>
            {archived && (
              <Badge colorScheme="gray" size="sm">
                Archived
              </Badge>
            )}
          </Flex>
        ),
      },
      {
        field: "handle",
        name: "Handle",
        sortable: true,
        component: ({ handle }) => (
          <Text color="muted" fontSize="sm">
            @{handle}
          </Text>
        ),
      },
      {
        field: "createdAt",
        name: "Created",
        sortable: true,
        component: ({ createdAt }) => <TimeAgo date={createdAt} />,
      },
      {
        field: "billing",
        name: "Billing",
        component: ({ billing }) => (
          <Text>{billing?.stripe?.productName || "Free"}</Text>
        ),
      },
      {
        field: "domains",
        name: "Domains",
        component: ({ domains }) => (
          <Flex gap="1" flexWrap="wrap" py="1">
            {domains?.map((domain) => (
              <Tag size="sm" key={domain._id} name={domain.domain} />
            ))}
          </Flex>
        ),
      },
      // {
      //   field: "actions",
      //   name: "Actions",
      //   width: 100,
      //   component: ({ _id }) => (
      //     <Flex gap={1}>
      //       <Tooltip label="Delete workspace" openDelay={800}>
      //         <IconButton
      //           size="sm"
      //           variant="ghost"
      //           aria-label="delete"
      //           onClick={(e) => {
      //             e.stopPropagation();
      //             handleDeleteWorkspace(_id);
      //           }}
      //         >
      //           <Icon color="muted" as={TrashIcon} />
      //         </IconButton>
      //       </Tooltip>
      //     </Flex>
      //   ),
      // },
    ],
    [handleDeleteWorkspace]
  );

  return (
    <Flex
      pb="4"
      flex="1"
      minH="full"
      minW="880px"
      overflow="auto"
      direction="column"
      ref={scrollContainer}
    >
      <Flex flex="1" gap="2" direction="column" px="10">
        <Flex gap="2" py="4" alignItems="center">
          <Text fontSize="24px" fontWeight="600">
            Workspaces
          </Text>
          <Box zIndex="100" ml="auto">
            <AuthorizeSessionSelect />
          </Box>
        </Flex>
        <Flex
          gap={3}
          w="full"
          top="0"
          py="2"
          bg="bg.primary"
          zIndex="10"
          position="sticky"
          alignItems="center"
          justifyContent="space-between"
          boxShadow="0 5px 5px 0px var(--chakra-colors-bg-primary)"
        >
          <Flex gap={2} alignItems="center"></Flex>
          <DebounceSearch
            onSearch={handleQueryChange}
            inputGroupProps={{ width: "250px", my: 0 }}
            inputProps={{
              placeholder: "Search workspaces...",
              defaultValue: filters.query,
            }}
          />
        </Flex>

        <Table
          resizable={true}
          columns={columns}
          data={workspaces}
          loading={loading}
          tableName="superadmin/workspaces"
          sorting={filters.sorting}
          setSorting={handleSortingChange}
          onRowClick={handleRowClick}
          useInfiniteScrolling={true}
          pageParams={filters.params}
          totalItemsCount={totalCount}
          onScrollEnd={onScrollEnd}
          noDataText={
            filters.query ? "No workspaces found" : "No workspaces available"
          }
        />
      </Flex>

      <WorkspaceManagerModal
        isOpen={isOpen}
        onClose={handleModalClose}
        workspace={selectedWorkspace}
        onWorkspaceUpdate={handleWorkspaceUpdate}
      />
    </Flex>
  );
});

export default WorkspaceManagement;
