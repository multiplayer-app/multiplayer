import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import cs from "classnames";
import {
  EntityType,
  RadarDetectionSource,
  RadarDetectionType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import {
  Flex,
  Icon,
  IconButton,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import {
  deleteFlowsBulk,
  deleteRadarDetections,
} from "shared/services/radar.service";
import { TableSimple as Table } from "shared/components/Table";
import useMessage from "shared/hooks/useMessage";
import { MergeIcon, TrashIcon } from "shared/icons";
import { SystemCatalogTabTypes } from "shared/models/enums";
import { useVersion } from "shared/providers/VersionContext";
import {
  deleteEntitiesBulk,
  mergeEntities,
} from "shared/services/version.service";
import SelectionIndicator from "shared/components/SelectionIndicator";
import MergeEntitiesModal from "shared/components/MergeEntitiesModal";
import DeleteDetectionsModal from "shared/components/DeleteDetectionsModal";
import {
  IDeleteRadarDetectionsReqParams,
  ITableSorting,
} from "shared/models/interfaces";

import { useSystemCatalog } from "../../SystemCatalogContext";
import {
  filtersPerTabConfig,
  TabToRadarDetectionTypeMap,
} from "../../systemCatalog.config";
import { selectedTabToCategoryMap } from "shared/configs/tabCategory.configs";
import SystemCatalogNoData from "../SystemCatalogNoData";
import SystemCatalogFilters from "../SystemCatalogFilters";
import CheckAccess from "shared/components/CheckAccess";
import CreateEntity from "shared/components/CreateEntity";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

const SystemCatalogData = ({
  columns,
  readonly,
  selectedTab,
  onRowClick,
}: {
  columns: any[];
  readonly: boolean;
  selectedTab: SystemCatalogTabTypes;
  onRowClick: (data: any) => void;
}) => {
  const {
    counts,
    isLoading,
    tabsState,
    setTabsState,
    isRadarActive,
    isCountLoading,
    systemCatalogData,
  } = useSystemCatalog();
  const message = useMessage();
  const { currentBranchId } = useVersion();
  const { workspaceId, projectId } = useParams();
  const mergingModalDisclosure = useDisclosure();
  const deleteDetectionsModalDisclosure = useDisclosure();
  const { withSandboxCheck } = useProjectSandbox();
  const config = filtersPerTabConfig[selectedTab];

  const { skip, limit } = tabsState[selectedTab]?.params || {};
  const { data, total } = systemCatalogData[selectedTab];

  const pageParams = useMemo(
    () => ({
      skip: skip || 0,
      limit: limit || 20,
    }),
    [skip, limit]
  );

  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedRows, setSelectedRows] = useState<{
    [index: string]: boolean;
  }>({});

  const selectedIds = useMemo(() => {
    return Object.keys(selectedRows)
      .filter((k) => !!selectedRows[k])
      .map((index) => {
        return data[index]?._id;
      });
  }, [data, selectedRows]);

  const isFilterAndQueryEmpty = useMemo(() => {
    const areFiltersEmpty =
      !tabsState[selectedTab]?.filter ||
      Object.values(tabsState[selectedTab].filter).every(
        (filter) => !filter?.length
      );

    return areFiltersEmpty && !tabsState[selectedTab]?.query;
  }, [selectedTab, tabsState]);

  const selectedItemsCount = useMemo(() => {
    return selectedIds.length;
  }, [selectedIds]);

  const selectedComponents = useMemo(() => {
    return selectedIds
      .map((id) => {
        const item = data.find((item) => item._id === id);
        if (!item) return null;
        return {
          key: item.componentName || item.key,
          entityId: item.entityId,
          isDetectedOnly: item.Sign === RadarDetectionSource.RADAR.toString(),
        };
      })
      .filter(Boolean);
  }, [selectedIds, data]);

  const hasDetections = useMemo(() => {
    if (isAllSelected) {
      return true;
    }

    return !selectedIds.every((selectedId) => {
      const item = data.find((item: any) => item?._id === selectedId);
      return item?.Sign === RadarDetectionSource.DOCS.toString();
    });
  }, [isAllSelected, selectedIds, data]);

  useEffect(() => {
    setTabsState((prev: any) => {
      if (!prev[selectedTab] || prev[selectedTab].params.skip === 0)
        return prev; // Temp fix.
      const newState = { ...prev };
      newState[selectedTab].params.skip = 0;
      return newState;
    });
  }, [selectedTab]);

  useEffect(() => {
    setSelectedRows({});
    setIsAllSelected(false);
  }, [selectedTab]);

  useEffect(() => {
    if (!isFilterAndQueryEmpty) {
      return;
    }
    if (selectedItemsCount === data.length) {
      setIsAllSelected(true);
    } else {
      if (data?.length === total || data.length !== selectedItemsCount)
        setIsAllSelected(false);
    }
  }, [isFilterAndQueryEmpty, selectedItemsCount, total, data?.length]);

  const handleAllRowsSelect = useCallback(
    (isSelected: boolean) => {
      if (isFilterAndQueryEmpty) {
        setIsAllSelected(isSelected); // only delete all items of the tab if there are no filters/query
      }

      const selection = isSelected
        ? data.reduce((acc, _, index) => {
            acc[index] = isSelected;
            return acc;
          }, {})
        : {};

      setSelectedRows(selection);
    },
    [data, setSelectedRows, isFilterAndQueryEmpty]
  );

  const openConfirmationModal = () => {
    withSandboxCheck(deleteDetectionsModalDisclosure.onOpen)();
  };

  const openMergingModal = () => {
    withSandboxCheck(mergingModalDisclosure.onOpen)();
  };

  const updateData = () => {
    setTabsState((prev: any) => {
      const newState = { ...prev };
      newState[selectedTab].params.skip = 0;
      return newState;
    });
    setSelectedRows({});
    setIsAllSelected(false);
  };

  const deleteDetections = async (sign: number, ids: string[]) => {
    try {
      const body: IDeleteRadarDetectionsReqParams = { Sign: sign };
      if (isAllSelected) {
        body.type = TabToRadarDetectionTypeMap[selectedTab];
      } else {
        body.ids = ids;
      }
      await deleteRadarDetections(workspaceId, projectId, body);
    } catch (error) {
      message.handleError(error);
    }
  };

  const deleteEntities = async (ids: string[], entityType: EntityType) => {
    try {
      await deleteEntitiesBulk(
        currentBranchId,
        !isAllSelected
          ? {
              entityIds: ids,
            }
          : {
              type: entityType,
            }
      );
    } catch (error) {
      message.handleError(error);
    }
  };

  const deleteFlows = async (ids: string[]) => {
    try {
      await deleteFlowsBulk(workspaceId, projectId, !isAllSelected && { ids });
    } catch (error) {
      message.handleError(error);
    }
  };

  const deleteDashboardData = async (
    type: "entity" | "detectable",
    sign: number
  ) => {
    if (type === "entity") {
      switch (selectedTab) {
        case SystemCatalogTabTypes.Platforms:
          await deleteEntities(selectedIds, EntityType.PLATFORM);
          break;
        case SystemCatalogTabTypes.Environments:
          await deleteEntities(selectedIds, EntityType.ENVIRONMENT);
          break;
        case SystemCatalogTabTypes.Flows:
          await deleteFlows(selectedIds);
          break;
      }
    } else {
      await deleteDetections(sign, selectedIds);
    }

    deleteDetectionsModalDisclosure.onClose();
    message.success("Successfully deleted selected items.");

    updateData();
  };

  const mergeSelectedComponents = async (key: string) => {
    try {
      const payload = selectedComponents.reduce(
        (acc, comp) => {
          if (comp.isDetectedOnly) {
            acc.keyAliases.push(comp.key);
          } else {
            acc.entityIds.push(comp.entityId);
          }
          return acc;
        },
        { keyAliases: [], entityIds: [] }
      );

      await mergeEntities(currentBranchId, {
        ...(payload.entityIds.length && { entityIds: payload.entityIds }),
        ...(payload.keyAliases.length && { keyAliases: payload.keyAliases }),
        type:
          selectedTab === SystemCatalogTabTypes.Components
            ? EntityType.PLATFORM_COMPONENT
            : EntityType.ENVIRONMENT,
        key,
      });

      mergingModalDisclosure.onClose();
      message.success("Successfully merged selected components.");

      updateData();
    } catch (error) {
      message.handleError(error);
    }
  };

  const rowClasses = (row: any) =>
    cs({
      default_cursor:
        row.type === RadarDetectionType.DEPENDENCY ||
        (row.type === RadarDetectionType.SERVICE &&
          +row.Sign === RadarDetectionSource.RADAR),
    });

  const onCreateComplete = (entityId: string, entityType: string) => {
    onRowClick({ entityId, entityType });
    updateData();
  };

  const handleRowClick = (row: any) => {
    selectedTab !== SystemCatalogTabTypes.Dependencies && onRowClick(row);
  };

  const handleSortingChange = (sorting: ITableSorting) => {
    setTabsState((prev: any) => {
      const newState = { ...prev };
      newState[selectedTab].sorting = sorting;
      newState[selectedTab].params.skip = 0;
      return newState;
    });
    setSelectedRows({});
  };
  const handlePageChange = useCallback(
    (skip: number) => {
      setTabsState((prev: any) => {
        const newState = { ...prev };
        newState[selectedTab].params.skip = skip;
        return newState;
      });
    },
    [selectedTab, setTabsState]
  );

  const handlePageSizeChange = useCallback(
    (limit: number) => {
      setTabsState((prev: any) => {
        const newState = { ...prev };
        newState[selectedTab].params = {
          ...newState[selectedTab].params,
          limit,
          skip: 0,
        };
        return newState;
      });
    },
    [selectedTab, setTabsState]
  );

  return !isCountLoading && counts[selectedTab] === 0 ? (
    <>
      {config.creatable && (
        <CheckAccess
          scope={RoleType.PROJECT}
          permission={RoleAccessAction.CREATE}
          entity={RoleProjectPermissionEntity.ENTITY}
        >
          <Flex justifyContent="flex-end" px={10} gap={2}>
            <CreateEntity
              type={selectedTabToCategoryMap[selectedTab]}
              onCreateComplete={onCreateComplete}
            />
          </Flex>
        </CheckAccess>
      )}
      <SystemCatalogNoData
        selectedTab={selectedTab}
        isRadarActive={isRadarActive}
      />
    </>
  ) : (
    <Flex
      flex="1"
      minH="0"
      bg="bg.primary"
      direction="column"
      px={{ base: "4", lg: "10" }}
    >
      {selectedItemsCount > 0 ? (
        <Flex position="sticky" top="12" bg="bg.primary" zIndex="10" w="full">
          <SelectionIndicator
            my="2"
            alignSelf="self-start"
            count={
              selectedItemsCount === data.length ? "All" : selectedItemsCount // didn't use isAllSelected to avoid flickering rerender
            }
            onResetSelection={() => {
              setSelectedRows({});
            }}
            actionButtons={
              <>
                {[
                  SystemCatalogTabTypes.Components,
                  SystemCatalogTabTypes.Environments,
                ].includes(selectedTab) &&
                  selectedItemsCount > 1 && (
                    <Tooltip label="Merge selected items" openDelay={800}>
                      <IconButton
                        size="md"
                        variant="ghost"
                        borderRadius="0"
                        aria-label="merge"
                        onClick={openMergingModal}
                      >
                        <Icon color="muted" as={MergeIcon} />
                      </IconButton>
                    </Tooltip>
                  )}
                <Tooltip label="Delete selected items" openDelay={800}>
                  <IconButton
                    size="md"
                    variant="ghost"
                    aria-label="delete"
                    borderLeftRadius="0"
                    onClick={openConfirmationModal}
                  >
                    <Icon color="muted" as={TrashIcon} />
                  </IconButton>
                </Tooltip>
              </>
            }
          />
        </Flex>
      ) : (
        <SystemCatalogFilters
          selectedTab={selectedTab}
          onCreateComplete={onCreateComplete}
        />
      )}

      <Flex flex="1">
        <Table
          data={data}
          columns={columns}
          loading={isLoading}
          tableName="sysDashboard"
          totalItemsCount={total}
          usePagination={true}
          useRowSelection={!readonly}
          selectedRows={selectedRows}
          pageParams={pageParams}
          sorting={tabsState[selectedTab]?.sorting}
          rowClasses={rowClasses}
          onRowClick={handleRowClick}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          setSelectedRows={setSelectedRows}
          onAllRowsSelect={handleAllRowsSelect}
          onSortingChange={handleSortingChange}
        />
      </Flex>
      <MergeEntitiesModal
        type={
          selectedTab === SystemCatalogTabTypes.Components
            ? "component"
            : "environment"
        }
        count={selectedItemsCount}
        disclosure={mergingModalDisclosure}
        selectedComponents={selectedComponents}
        onMerge={mergeSelectedComponents}
      />
      <DeleteDetectionsModal
        type={selectedTab}
        isAll={isAllSelected}
        hasDetections={hasDetections}
        onDelete={deleteDashboardData}
        disclosure={deleteDetectionsModalDisclosure}
        count={isAllSelected ? total : selectedItemsCount}
      />
    </Flex>
  );
};

export default SystemCatalogData;
