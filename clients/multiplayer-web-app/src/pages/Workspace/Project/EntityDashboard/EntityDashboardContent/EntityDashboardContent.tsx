import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import pluralize from "pluralize";

import { Flex, Icon, IconButton, Text, Tooltip } from "@chakra-ui/react";
import { TableSimple as Table } from "shared/components/Table";
import Tag from "shared/components/Tag";
import { TrashIcon } from "shared/icons";

import EntityFilters from "./EntityFilters/EntityFilters";

import { useVersion } from "shared/providers/VersionContext";
import { useEntities } from "shared/providers/EntitiesContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { NavigationMode, useTabs } from "shared/providers/TabsContext";

import { stringifyTag } from "shared/utils";
import TimeAgo from "shared/components/TimeAgo";
import useMessage from "shared/hooks/useMessage";
import EntityMetaIcon from "shared/components/EntityMetaIcon";
import SelectionIndicator from "shared/components/SelectionIndicator";
import NotebookIntro from "shared/components/NotebookIntro";

import {
  EntityType,
  ITag,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import { EntityCategories, SortingDirection } from "shared/models/enums";
import { deleteEntitiesBulk } from "shared/services/version.service";
import { EntityWithMeta, IProjectConfig } from "shared/models/interfaces";

import EntityDashboardHeader from "./EntityDashboardHeader";
import { useEntityDashboardState } from "./useEntityDashboardState";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

interface EntityDashboardContentProps {
  category: EntityCategories;
  config: IProjectConfig;
  type: EntityType | string;
}

const EntityDashboardContent = memo(
  ({ category, config, type }: EntityDashboardContentProps) => {
    const message = useMessage();
    const { onEntityOpen } = useTabs();
    const { hasAccess } = usePermissions();
    const { currentBranchId } = useVersion();
    const { openAlertDialog } = useAlertDialog();
    const { entities, entitiesFetching } = useEntities();
    const { withSandboxCheck } = useProjectSandbox();
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>(
      {}
    );
    const { filters, setFilters, scrollTop, setScrollTop } =
      useEntityDashboardState(category);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const allEntities = useMemo(() => {
      return entities[category].filter((entity) => !entity.default);
    }, [entities, category]);

    const filteredEntities = useMemo(() => {
      let filtered = [...allEntities];

      if (filters.query) {
        filtered = filtered.filter(
          (entity) =>
            entity.key?.toLowerCase().includes(filters.query.toLowerCase()) ||
            entity.type.toLowerCase().includes(filters.query.toLowerCase())
        );
      }

      if (filters.tags.length > 0) {
        filtered = filtered.filter((entity) =>
          filters.tags.some((tagString) => {
            const [key, value] = tagString.includes(":")
              ? tagString.split(":", 2)
              : ["", tagString];

            return entity.tags?.some((entityTag) => {
              const entityTagString = stringifyTag([
                entityTag.key,
                entityTag.value,
              ]);
              return entityTagString === tagString;
            });
          })
        );
      }

      if (filters.sorting) {
        const { key, direction } = filters.sorting;
        if (key === "key") {
          filtered = filtered.sort((a, b) => {
            const aKey = a.key?.toLowerCase() || "";
            const bKey = b.key?.toLowerCase() || "";
            return direction === SortingDirection.ASC
              ? aKey.localeCompare(bKey)
              : bKey.localeCompare(aKey);
          });
        } else if (key === "createdAt") {
          filtered = filtered.sort((a, b) => {
            const aDate = new Date(a.createdAt || 0).getTime();
            const bDate = new Date(b.createdAt || 0).getTime();
            return direction === SortingDirection.ASC
              ? aDate - bDate
              : bDate - aDate;
          });
        }
      }
      return filtered;
    }, [allEntities, filters]);

    const selectedIds = useMemo(() => {
      return Object.keys(selectedRows)
        .filter((k) => !!selectedRows[k])
        .map((index) => {
          return filteredEntities[parseInt(index)]?.entityId;
        });
    }, [filteredEntities, selectedRows]);

    const selectedItemsCount = selectedIds.length;

    useEffect(() => {
      if (tableContainerRef.current && scrollTop > 0) {
        requestAnimationFrame(() => {
          if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = scrollTop;
          }
        });
      }
    }, []);

    useEffect(() => {
      const container = tableContainerRef.current;
      if (!container) return;

      const handleScroll = () => {
        setScrollTop(container.scrollTop);
      };

      container.addEventListener("scroll", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }, [setScrollTop]);

    const onTagsChange = useCallback(
      ([key, value]) => {
        setFilters({
          ...filters,
          tags: Array.from(
            new Set([...filters.tags, stringifyTag([key, value])])
          ),
        });
      },
      [filters, setFilters]
    );

    const onSortingChange = useCallback(
      (sorting) => {
        setFilters({
          ...filters,
          sorting,
        });
      },
      [filters, setFilters]
    );

    const resetSelection = useCallback(() => {
      setSelectedRows({});
      setIsAllSelected(false);
    }, []);

    const isFilterAndQueryEmpty = useMemo(
      () => !(filters.query || filters.tags.length > 0),
      [filters.query, filters.tags.length]
    );

    useEffect(() => {
      resetSelection();
    }, [filters.query, filters.tags.length, filters.sorting, resetSelection]);

    useEffect(() => {
      if (!isFilterAndQueryEmpty) {
        return;
      }
      if (
        filteredEntities.length &&
        selectedItemsCount === filteredEntities.length
      ) {
        setIsAllSelected(true);
      } else {
        if (filteredEntities.length !== selectedItemsCount) {
          setIsAllSelected(false);
        }
      }
    }, [isFilterAndQueryEmpty, selectedItemsCount, filteredEntities.length]);

    const onAllRowsSelect = useCallback(
      (isSelected: boolean) => {
        if (isFilterAndQueryEmpty) {
          setIsAllSelected(isSelected);
        }

        const selection = isSelected
          ? Object.fromEntries(
              filteredEntities.map((_, index) => [index, true])
            )
          : {};

        setSelectedRows(selection);
      },
      [filteredEntities, isFilterAndQueryEmpty]
    );

    const deleteEntities = async (ids: string[]) => {
      try {
        await deleteEntitiesBulk(
          currentBranchId,
          !isAllSelected
            ? {
                entityIds: ids,
              }
            : { type: type as EntityType }
        );
        message.success(
          `Successfully deleted ${ids.length} ${pluralize(
            "entity",
            ids.length
          )}`
        );
      } catch (error) {
        message.handleError(error);
      } finally {
        resetSelection();
      }
    };

    const onSelectionDelete = async () => {
      const result = await openAlertDialog({
        title: "Deleting entities",
        description: (
          <>
            Are you sure you want to delete{" "}
            <b>
              {isAllSelected
                ? `all (${filteredEntities.length})`
                : selectedItemsCount}
            </b>{" "}
            {pluralize("entity", selectedItemsCount)}?
          </>
        ),
      });
      if (result) {
        deleteEntities(selectedIds);
      }
    };

    const handleRowClick = (
      row: EntityWithMeta,
      e: React.MouseEvent<HTMLTableRowElement>
    ) => {
      const mode =
        e.metaKey || e.ctrlKey ? NavigationMode.NEW_TAB : NavigationMode.TABS;
      onEntityOpen(row, mode);
    };

    const columns = useMemo(
      () => [
        {
          field: "key",
          name: "Name",
          sortable: true,
          minWidth: "200px",
          component: ({ key, type, metadata }) => {
            return (
              <Flex alignItems="center" gap={2}>
                <EntityMetaIcon metadata={metadata} type={type} />
                <Text fontWeight="500">{key || "Unnamed Entity"}</Text>
              </Flex>
            );
          },
        },
        {
          field: "createdAt",
          name: "Created",
          sortable: true,
          minWidth: "120px",
          component: ({ createdAt }) => <TimeAgo date={createdAt} />,
        },
        {
          field: "tags",
          name: "Tags",
          minWidth: "200px",
          component: ({ tags }) => {
            return tags && tags.length > 0 ? (
              <Flex gap="1" flexWrap="wrap" py="1">
                {tags.map((tag: ITag) => (
                  <Tag
                    size="sm"
                    key={tag.key + tag.value}
                    name={`${tag.key ? tag.key + ":" : ""}${tag.value}`}
                    onClick={() => onTagsChange([tag.key, tag.value])}
                  />
                ))}
              </Flex>
            ) : null;
          },
        },
      ],
      [onTagsChange]
    );

    const access = useMemo(() => {
      return {
        deleteEntity: hasAccess(
          RoleProjectPermissionEntity.ENTITY,
          RoleAccessAction.DELETE,
          RoleType.PROJECT
        ),
        updateEntity: hasAccess(
          RoleProjectPermissionEntity.ENTITY,
          RoleAccessAction.UPDATE,
          RoleType.PROJECT
        ),
      };
    }, [hasAccess]);

    return (
      <Flex
        pb="4"
        flex="1"
        minH="full"
        overflow="auto"
        direction="column"
        ref={tableContainerRef}
      >
        {isFilterAndQueryEmpty &&
        !filteredEntities.length &&
        type === EntityType.NOTEBOOK ? (
          <NotebookIntro />
        ) : (
          <Flex
            flex="1"
            gap="2"
            direction="column"
            px={{ base: "4", lg: "10" }}
          >
            <>
              <EntityDashboardHeader />
              {selectedItemsCount > 0 ? (
                <Flex
                  py="2"
                  top="0"
                  w="full"
                  zIndex="10"
                  bg="bg.primary"
                  position="sticky"
                >
                  <SelectionIndicator
                    alignSelf="self-start"
                    count={
                      selectedItemsCount === filteredEntities.length
                        ? "All"
                        : selectedItemsCount
                    }
                    onResetSelection={resetSelection}
                    actionButtons={
                      <>
                        {access.deleteEntity && (
                          <Tooltip
                            label="Delete selected items"
                            openDelay={800}
                          >
                            <IconButton
                              size="md"
                              variant="ghost"
                              aria-label="delete"
                              borderLeftRadius="0"
                              onClick={withSandboxCheck(onSelectionDelete)}
                            >
                              <Icon color="muted" as={TrashIcon} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    }
                  />
                </Flex>
              ) : (
                <EntityFilters
                  config={config}
                  filters={filters}
                  setFilters={setFilters}
                />
              )}

              <Table
                columns={columns}
                data={filteredEntities}
                loading={entitiesFetching}
                tableName={`entities/${category}`}
                useRowSelection={access.deleteEntity}
                sorting={filters.sorting}
                onRowClick={handleRowClick}
                onSortingChange={onSortingChange}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                onAllRowsSelect={onAllRowsSelect}
                noDataText={
                  isFilterAndQueryEmpty
                    ? config?.emptyScreen?.title ||
                      "You don't have any entities yet!"
                    : "No results found"
                }
              />
            </>
          </Flex>
        )}
      </Flex>
    );
  }
);

export default EntityDashboardContent;
