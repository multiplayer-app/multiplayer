import { Box, Flex, IconButton, SimpleGrid } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  RadarDetectionEndpointType,
  RadarDetectionSource,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

import TagInput from "shared/components/TagInput";
import Visibility, { useVisibility } from "shared/components/Visibility";
import CheckAccess from "shared/components/CheckAccess";
import DebounceSearch from "shared/components/DebounceSearch";
import MultiSelectFilter from "shared/components/MultiSelectFilter";
import { SystemCatalogTabTypes } from "shared/models/enums";
import { DetectionSourceLabels } from "shared/components/ComponentStatusBadge";
import Icon from "shared/components/Icon";

import CreateEntity from "shared/components/CreateEntity";
import { useSystemCatalog } from "../../SystemCatalogContext";
import {
  filtersPerTabConfig,
  SYSTEM_CATALOG_LIMIT,
} from "../../systemCatalog.config";
import { selectedTabToCategoryMap } from "shared/configs/tabCategory.configs";

const parseTags = (tags: string[]) => {
  return tags?.map((tag: string) => (tag.startsWith(":") ? tag.slice(1) : tag));
};

const SystemCatalogFilters = ({
  selectedTab,
  onCreateComplete,
}: {
  selectedTab: SystemCatalogTabTypes;
  onCreateComplete: (entityId: string, entityType: string) => void;
}) => {
  const {
    tabsState,
    setTabsState,
    detectedEnvironments,
    componentsInFlows,
    componentsInDeps,
  } = useSystemCatalog();
  const [currentQuery, setCurrentQuery] = useState(
    tabsState[selectedTab].query
  );

  const [tags, setTags] = useState<string[]>(
    parseTags(tabsState[selectedTab].tags)
  );

  const config = filtersPerTabConfig[selectedTab];
  const filterState = tabsState[selectedTab]?.filter;

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const isDesktop = useVisibility({ base: false, lg: true });

  useEffect(() => {
    setCurrentQuery(tabsState[selectedTab].query);
    setTags(parseTags(tabsState[selectedTab].tags));
  }, [selectedTab, tabsState]);

  const onFilterChange = (newParam: any) => {
    setTabsState((prev) => ({
      ...prev,
      [selectedTab]: {
        ...prev[selectedTab],
        filter: {
          ...prev[selectedTab].filter,
          ...newParam,
        },
        params: { skip: 0, limit: SYSTEM_CATALOG_LIMIT },
      },
    }));
  };

  const onQueryChange = (query: string) => {
    setTabsState((prev) => ({
      ...prev,
      [selectedTab]: {
        ...prev[selectedTab],
        params: { skip: 0, limit: SYSTEM_CATALOG_LIMIT },
        query,
      },
    }));
  };

  const onTagQueryChange = (tags: string[]) => {
    setTags(tags);
    const tagValues = tags.map((tag) => {
      return tag.split(":").length === 1 ? `:${tag}` : tag;
    });

    setTabsState((prev) => ({
      ...prev,
      [selectedTab]: {
        ...prev[selectedTab],
        params: { skip: 0, limit: SYSTEM_CATALOG_LIMIT },
        tags: tagValues,
      },
    }));
  };

  const showFilters = isDesktop || isMobileFiltersOpen;

  return (
    <Flex
      gap="2"
      w="full"
      top="0"
      py="2"
      bg="bg.primary"
      zIndex="10"
      flexDirection={{ base: "column-reverse", lg: "row" }}
      position={{ base: "static", lg: "sticky" }}
    >
      {showFilters && (
        <Box
          as={isDesktop ? Flex : SimpleGrid}
          flex="1"
          {...(!isDesktop
            ? { columns: 2, spacing: 2, alignItems: "stretch" }
            : { gap: 2, flex: 1, flexWrap: "wrap", alignItems: "flex-start" })}
        >
          {config.environments && (
            <MultiSelectFilter
              menuPlacement="bottom-start"
              capitalizeLabels={false}
              options={detectedEnvironments}
              selection={filterState.environments || []}
              setSelection={(selectionKey, newSelection) => {
                onFilterChange({ [selectionKey]: newSelection });
              }}
              selectionKey="environments"
              filterName="Environment"
            />
          )}
          {config.components && (
            <MultiSelectFilter
              menuPlacement="bottom-start"
              options={
                selectedTab === SystemCatalogTabTypes.Flows
                  ? componentsInFlows
                  : componentsInDeps
              }
              selection={filterState.components || []}
              setSelection={(selectionKey, newSelection) => {
                onFilterChange({ [selectionKey]: newSelection });
              }}
              selectionKey="components"
              filterName="Component"
            />
          )}
          {config.sourceComponent && (
            <MultiSelectFilter
              searchable
              menuPlacement="bottom-start"
              capitalizeLabels={false}
              options={componentsInDeps.sort((a, b) =>
                a.label.localeCompare(b.label)
              )}
              selection={filterState.sourceComponent || []}
              setSelection={(selectionKey, newSelection) => {
                onFilterChange({ [selectionKey]: newSelection });
              }}
              selectionKey="sourceComponent"
              filterName="Source"
            />
          )}
          {config.targetComponent && (
            <MultiSelectFilter
              searchable
              menuPlacement="bottom-start"
              capitalizeLabels={false}
              options={componentsInDeps.sort((a, b) =>
                a.label.localeCompare(b.label)
              )}
              selection={filterState.targetComponent || []}
              setSelection={(selectionKey, newSelection) => {
                onFilterChange({ [selectionKey]: newSelection });
              }}
              selectionKey="targetComponent"
              filterName="Target"
            />
          )}
          {config.protocol && (
            <MultiSelectFilter
              menuPlacement="bottom-start"
              options={Object.values(RadarDetectionEndpointType).map((val) => ({
                label: val,
                value: val,
              }))}
              selection={filterState.protocol || []}
              setSelection={(selectionKey, newSelection) => {
                onFilterChange({ [selectionKey]: newSelection });
              }}
              selectionKey="protocol"
              filterName="Protocol"
            />
          )}
          {config.status && (
            <MultiSelectFilter
              menuPlacement="bottom-start"
              options={Object.keys(RadarDetectionSource)
                .filter((key) => isNaN(Number(key)))
                .map((key) => ({
                  label: DetectionSourceLabels[RadarDetectionSource[key]],
                  value: RadarDetectionSource[key].toString(),
                }))}
              selection={filterState.status || []}
              setSelection={(selectionKey, newSelection) => {
                onFilterChange({ [selectionKey]: newSelection });
              }}
              selectionKey="status"
              filterName="Status"
            />
          )}
          {config.tags && (
            <TagInput
              value={tags || []}
              inputPlaceholder="Search by tag"
              boxProps={{ width: "auto", flex: 0 }}
              onChange={onTagQueryChange}
            />
          )}
        </Box>
      )}
      <Flex
        gap={2}
        alignItems="center"
        ml={{ base: 0, lg: "auto" }}
        justifyContent="space-between"
      >
        {config.search && (
          <DebounceSearch
            onSearch={onQueryChange}
            inputGroupProps={{
              my: 0,
              ml: { base: 0, lg: "auto" },
              mr: { base: "auto", lg: 0 },
              width: { base: "auto", lg: "250px" },
            }}
            inputProps={{
              placeholder: "Start searching...",
              value: currentQuery,
              onChange: (event) => {
                setCurrentQuery(event.target.value);
              },
            }}
          />
        )}
        {config.creatable && (
          <Visibility hideBelow="lg">
            <CheckAccess
              scope={RoleType.PROJECT}
              permission={RoleAccessAction.CREATE}
              entity={RoleProjectPermissionEntity.ENTITY}
            >
              <CreateEntity
                type={selectedTabToCategoryMap[selectedTab]}
                onCreateComplete={onCreateComplete}
              />
            </CheckAccess>
          </Visibility>
        )}
        {!isDesktop && (
          <IconButton
            size="md"
            variant="light"
            icon={<Icon name="Funnel" />}
            aria-label="toggle filters"
            onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
          />
        )}
      </Flex>
    </Flex>
  );
};

export default SystemCatalogFilters;
