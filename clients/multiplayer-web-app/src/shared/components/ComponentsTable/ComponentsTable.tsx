import { useCallback, useMemo } from "react";
import { Flex, Icon, IconButton, Tooltip } from "@chakra-ui/react";
import {
  Group,
  ComponentType,
  ComponentTypeToNameMap,
} from "@multiplayer/types";
import { clone } from "shared/utils";
import { TrashIcon } from "shared/icons";
import Table from "shared/components/Table";
import DebounceSearch from "shared/components/DebounceSearch";
import { useEntities } from "shared/providers/EntitiesContext";
import { useActiveTabState } from "shared/providers/TabsContext";
import MultiSelectFilter from "shared/components/MultiSelectFilter";
import SelectionIndicator from "shared/components/SelectionIndicator";
import { EntityCategories, SortingDirection } from "shared/models/enums";

const defaultFiltersState = {
  type: [],
  tags: [],
  parentGroup: [],
  componentType: [],
};

const ComponentsTable = ({
  data,
  height,
  groups,
  columns,
  searchProps,
  selectedRows,
  setSelectedRows,
  tableWrapperHeight,
  onSelectionDelete,
  customTags = false,
  allowSelection = true,
  isAIExtracted = false,
  rowClasses,
}: {
  data: any;
  columns: any;
  height: string;
  searchProps: any;
  selectedRows?: any;
  allowSelection?: boolean;
  setSelectedRows?: React.Dispatch<
    React.SetStateAction<{
      [key: string]: boolean;
    }>
  >;
  groups?: Group[];
  customTags?: boolean;
  isAIExtracted?: boolean;
  tableWrapperHeight?: string;
  children?: React.ReactNode;
  onSelectionDelete?: () => void;
  rowClasses?: (row: any) => string;
}) => {
  const { entities } = useEntities();

  const [{ filters, sorting, searchQuery }, setActiveTabState] =
    useActiveTabState({
      sorting: null,
      searchQuery: "",
      filters: clone(defaultFiltersState),
    });

  const handleSetFilters = (selectionKey: string, newSelection: any[]) => {
    setActiveTabState((prev) => ({
      ...prev,
      filters: {
        ...defaultFiltersState,
        ...prev.filters,
        [selectionKey]: newSelection,
      },
    }));
  };

  const handleSetSorting = (sorting): void => {
    setActiveTabState((prev) => ({ ...prev, sorting }));
    setSelectedRows({});
  };

  const handleSetQuery = (searchQuery: string): void => {
    setActiveTabState((prev) => ({ ...prev, searchQuery }));
  };

  const selectedComponentsCount = useMemo(() => {
    return (
      selectedRows &&
      Object.keys(selectedRows)?.filter((k) => !!selectedRows[k]).length
    );
  }, [selectedRows]);

  const tableData = useMemo(() => {
    let components = data.map((c) => ({
      _id: c.nodeId || c.entityId, // nodeId is for custom views, entityId is for All view
      entityName: c.key || c.name,
      type: c.type,
      description: c.description,
      isSystem: c.isSystem,
      tags: customTags
        ? c.tags
        : entities[EntityCategories.COMPONENT].find(
            (e) => e.entityId === c.linkedTo
          )?.tags || [],
      group: c.group,
    }));

    if (filters && typeof filters === "object" && !Array.isArray(filters)) {
      const { parentGroup, type, tags } = filters;

      if (parentGroup?.length) {
        components = components.filter(
          (d) => !!parentGroup.find((t) => t.value === d.group?.id)
        );
      }

      if (type?.length) {
        components = components.filter(
          (d) => !!type.find((t) => t.value === d.type)
        );
      }

      if (tags?.length) {
        components = components.filter((d) => {
          return d.tags.some((t) => tags.some((f) => f.value === t.value));
        });
      }
    }
    if (searchQuery?.length > 0) {
      components = components.filter((c) =>
        c.entityName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sorting) {
      components.sort((a, b) =>
        sorting.direction.toString() === SortingDirection.ASC
          ? b.entityName.localeCompare(a.entityName)
          : a.entityName.localeCompare(b.entityName)
      );
    }
    return components;
  }, [data, sorting, filters, searchQuery, isAIExtracted]);

  const allTags = useMemo(() => {
    return Array.from(
      Object.values(tableData).reduce<Set<string>>((acc, i: any) => {
        i.tags.forEach((t) => acc.add(typeof t === "string" ? t : t.value));
        return acc;
      }, new Set())
    ).map((tag) => ({ label: tag, value: tag }));
  }, [tableData]);

  const onAllRowsSelect = useCallback(
    (isSelected: boolean) => {
      if (allowSelection) {
        const selection = isSelected
          ? tableData.reduce((acc, _, index) => {
              acc[index] = isSelected;
              return acc;
            }, {})
          : {};

        setSelectedRows(selection);
      }
    },
    [tableData, setSelectedRows, allowSelection]
  );
  return (
    <Flex w="100%" h={height} padding="1" direction="column">
      {
        <Flex
          h="56px"
          w="100%"
          py="4"
          justifyContent="space-between"
          alignItems="center"
          position="relative"
        >
          <Flex
            position="absolute"
            top={2}
            left={0}
            zIndex={1}
            backgroundColor="bg.primary"
          >
            {selectedComponentsCount > 0 && (
              <SelectionIndicator
                count={selectedComponentsCount}
                onResetSelection={() => {
                  setSelectedRows({});
                }}
                actionButtons={
                  onSelectionDelete && (
                    <>
                      <Tooltip label="Delete selected items" openDelay={800}>
                        <IconButton
                          size="md"
                          variant="ghost"
                          aria-label="delete"
                          borderLeftRadius="0"
                          onClick={onSelectionDelete}
                        >
                          <Icon color="muted" as={TrashIcon} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )
                }
              />
            )}
          </Flex>

          <Flex
            fontSize="xs"
            color="muted"
            gap="3"
            opacity={selectedComponentsCount > 0 ? "10%" : "100%"}
            pointerEvents={selectedComponentsCount > 0 ? "none" : "all"}
          >
            <MultiSelectFilter
              options={[
                {
                  label: ComponentTypeToNameMap[ComponentType.GENERIC],
                  value: ComponentType.GENERIC,
                },
                {
                  label: ComponentTypeToNameMap[ComponentType.CLIENT],
                  value: ComponentType.CLIENT,
                },
                {
                  label: ComponentTypeToNameMap[ComponentType.PLATFORM],
                  value: ComponentType.PLATFORM,
                },
                {
                  label: ComponentTypeToNameMap[ComponentType.SERVICE],
                  value: ComponentType.SERVICE,
                },
              ]}
              selection={filters.type}
              setSelection={handleSetFilters}
              selectionKey="type"
              filterName="Type"
            />

            <MultiSelectFilter
              options={allTags}
              searchable={true}
              selection={filters.tags}
              setSelection={handleSetFilters}
              selectionKey="tags"
              filterName="Tags"
            />
            {!!groups && (
              <MultiSelectFilter
                options={groups.map((g) => ({ label: g.name, value: g.id }))}
                selection={filters.parentGroup || []}
                setSelection={handleSetFilters}
                selectionKey="parentGroup"
                filterName="Group"
              />
            )}
          </Flex>
          <DebounceSearch
            hideDeleteButton={searchProps.hideDelete}
            showSearchIcon={searchProps.showSearchIcon}
            inputGroupProps={{
              padding: "0",
              margin: "0",
              maxWidth: "240px",
            }}
            inputProps={{
              placeholder: "Search for components",
              defaultValue: searchQuery,
              ...searchProps.inputProps,
            }}
            onSearch={handleSetQuery}
          />
        </Flex>
      }
      <Table
        data={tableData}
        columns={columns}
        sorting={sorting}
        rowClasses={rowClasses}
        setSorting={handleSetSorting}
        useRowSelection={allowSelection}
        selectRowOnClick={allowSelection}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        onAllRowsSelect={onAllRowsSelect}
        tableWrapperHeight={tableWrapperHeight}
        noDataText="There are no components."
      />
    </Flex>
  );
};

export default ComponentsTable;
