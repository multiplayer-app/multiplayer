import { useMemo, useState, useEffect } from "react";
import { Collapse, Flex, Grid, Box, HStack } from "@chakra-ui/react";

import DebugSessionConfigs from "pages/Workspace/Project/Debugger/DebugSession/DebugSessionDetails/DebugSessionConfigs";
import {
  DebugSessionNodeType,
  IDebugSessionNode,
  ILogNode,
  ITraceNode,
  SessionTabIndex,
} from "pages/Workspace/Project/Debugger/DebugSession/types";
import { useDebugSession } from "pages/Workspace/Project/Debugger/DebugSession/DebugSessionContext";
import { getNodeStatus } from "pages/Workspace/Project/Debugger/DebugSession/utils";
import MultiSelectFilter from "shared/components/MultiSelectFilter";
import DebounceSearch from "shared/components/DebounceSearch";
import SwitchButtons from "shared/components/SwitchButtons";
import Visibility from "shared/components/Visibility";

import BulkSpansAddButton from "../../attachments/BulkSpansAddButton";

import { WarningCircleIcon, InfoOutlineIcon } from "shared/icons";

const levelOptions = [
  {
    label: "Info",
    value: "info",
  },
  {
    label: "Error",
    value: "error",
  },
  {
    label: "Warn",
    value: "warn",
  },
  {
    label: "Debug",
    value: "debug",
  },
];

const typeOptions = [
  { label: "Trace", value: DebugSessionNodeType.Trace },
  { label: "Log", value: DebugSessionNodeType.Log },
  { label: "Event", value: DebugSessionNodeType.Event },
  { label: "Console", value: DebugSessionNodeType.Console },
];

const DebugSessionControlPanel = ({ readonly }: { readonly: boolean }) => {
  const { tabIndex, sessionNodes, filters, handleSetFilters } =
    useDebugSession();
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const logs = sessionNodes[DebugSessionNodeType.Log];
  const traces = sessionNodes[DebugSessionNodeType.Trace];
  const [expanded, setExpanded] = useState(false);

  const onToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const collectServiceNames = (
    nodes: IDebugSessionNode<any>[] = [],
    set: Set<string>
  ) => {
    nodes.forEach((node) => {
      const { ServiceName, SpanAttributes } = node.meta || {};
      const name = SpanAttributes?.["db.system"] || ServiceName;

      if (name) {
        set.add(name);
      }
      if (node.childSpans && node.childSpans.length > 0) {
        collectServiceNames(node.childSpans, set);
      }
    });
  };

  useEffect(() => {
    if (filters.search !== searchValue) {
      handleSetFilters({ search: searchValue });
    }
  }, [searchValue, handleSetFilters]);

  const componentFilterData = useMemo(() => {
    const componentNamesSet = new Set<string>();

    logs.forEach((log: IDebugSessionNode<ILogNode>) => {
      if (log?.meta?.ServiceName) {
        componentNamesSet.add(log.meta.ServiceName);
      }
    });

    collectServiceNames(traces, componentNamesSet);

    const optionsData = [];

    for (const componentName of componentNamesSet) {
      optionsData.push({ label: componentName, value: componentName });
    }

    return optionsData;
  }, [logs, traces]);

  const statusFilterData = useMemo(() => {
    const statusNamesSet = new Set<string>();
    traces.forEach((trace: IDebugSessionNode<ITraceNode>) => {
      const { statusCode, statusText } = getNodeStatus(trace) || {};

      statusNamesSet.add(`${statusCode} ${statusText}`);
    });

    const optionsData = [];

    for (const status of statusNamesSet) {
      optionsData.push({ label: status, value: status });
    }

    return optionsData;
  }, [traces]);

  const filterVisibility = useMemo(
    () => ({
      type: tabIndex === SessionTabIndex.All,
      component: [
        SessionTabIndex.Logs,
        SessionTabIndex.Traces,
        SessionTabIndex.All,
      ].includes(tabIndex),
      level: [SessionTabIndex.Logs, SessionTabIndex.All].includes(tabIndex),
      status:
        tabIndex === SessionTabIndex.Traces || tabIndex === SessionTabIndex.All,
    }),
    [tabIndex]
  );

  const hasAppliedFilters = useMemo(() => {
    return (
      filters.mostRelevant ||
      filters.showOnlyExceptions ||
      (filterVisibility.level && filters.level?.length > 0) ||
      (filterVisibility.status && filters.status?.length > 0) ||
      (filterVisibility.component && filters.component?.length > 0) ||
      (filterVisibility.type && filters.type?.length > 0)
    );
  }, [filters, filterVisibility]);
  if (
    tabIndex === SessionTabIndex.Metadata ||
    tabIndex === SessionTabIndex.Comments
  )
    return null;
  return (
    <Box
      px="2"
      py="1.5"
      bg="bg.surface"
      borderBottom="1px solid"
      borderColor="border.primary"
    >
      <Flex gap="2" justifyContent="space-between" alignItems="center">
        {!readonly && (
          <HStack spacing="1" flexShrink={0}>
            <Box id="check-all-portal" />
            <BulkSpansAddButton />
          </HStack>
        )}
        <DebounceSearch
          onSearch={setSearchValue}
          inputProps={{ placeholder: "Search" }}
          inputGroupProps={{ m: 0, maxWidth: "200px", mr: "auto", size: "sm" }}
        />

        <DebugSessionConfigs
          hasFilters={hasAppliedFilters}
          filtersExpanded={expanded}
          onToggleFilters={onToggleExpanded}
        />
      </Flex>
      <Collapse in={expanded} animateOpacity>
        <Grid templateColumns="repeat(2, 1fr)" gap="2" py="2">
          {filterVisibility.type && (
            <MultiSelectFilter
              options={typeOptions}
              filterName="Type"
              selectionKey="type"
              selection={filters.type}
              setSelection={(selectionKey, newSelection) => {
                handleSetFilters({ [selectionKey]: newSelection });
              }}
              menuProps={{ zIndex: 12 }}
              sortAlphabetically={false}
              menuPlacement="bottom-start"
            />
          )}
          {/* Raul: stars get removed in the favour of the AI */}
          {/* <StarCheckbox
          starred={filters.starred}
          toggleStarred={() => handleSetFilters({ starred: !filters.starred })}
        /> */}
          {filterVisibility.component && (
            <MultiSelectFilter
              options={componentFilterData}
              filterName="Component"
              selectionKey="component"
              capitalizeLabels={false}
              selection={filters.component}
              setSelection={(selectionKey, newSelection) => {
                handleSetFilters({ [selectionKey]: newSelection });
              }}
              menuPlacement="bottom-start"
              menuProps={{ zIndex: 12 }}
            />
          )}

          {filterVisibility.status && (
            <MultiSelectFilter
              options={statusFilterData}
              filterName="Status"
              selectionKey="status"
              selection={filters.status}
              setSelection={(selectionKey, newSelection) => {
                handleSetFilters({ [selectionKey]: newSelection });
              }}
              menuPlacement="bottom-start"
              menuProps={{ zIndex: 12 }}
            />
          )}
          {filterVisibility.level && (
            <MultiSelectFilter
              options={levelOptions}
              filterName="Level"
              selectionKey="level"
              selection={filters.level}
              sortAlphabetically={false}
              setSelection={(selectionKey, newSelection) => {
                handleSetFilters({ [selectionKey]: newSelection });
              }}
              menuPlacement="bottom-start"
              menuProps={{ zIndex: 12 }}
            />
          )}
        </Grid>
        <Visibility hideBelow="md">
          <SwitchButtons
            value={
              filters.mostRelevant ? 1 : filters.showOnlyExceptions ? 2 : 0
            }
            onChange={(value) =>
              handleSetFilters({
                mostRelevant: value === 1,
                showOnlyExceptions: value === 2,
              })
            }
            hideLabel={false}
            options={[
              { value: 0, label: "All" },
              {
                value: 1,
                label: "Most Relevant",
                icon: InfoOutlineIcon,
              },
              {
                value: 2,
                label: "Issues / Exceptions",
                iconColor: "red.400",
                icon: WarningCircleIcon,
              },
            ]}
          />
        </Visibility>
      </Collapse>
    </Box>
  );
};

export default DebugSessionControlPanel;
