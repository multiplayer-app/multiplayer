import { useMemo, useState } from "react";
import { Icon, Flex } from "@chakra-ui/react";

import {
  CompressLine,
  ExpandLine,
  FilterActiveIcon,
  FilterIcon,
  ResetTimeIcon,
  TimelineIcon,
  WaterfallIcon,
} from "shared/icons";

import IconButton from "shared/components/IconButton";
import { SessionTabIndex, SessionPreviewMode } from "../../types";
import { useDebugSession } from "../../DebugSessionContext";
import { useDebugSessionLayout } from "../../DebugSessionLayoutContext";
import Visibility from "shared/components/Visibility";

interface DebugSessionConfigsProps {
  hasFilters: boolean;
  filtersExpanded: boolean;
  onToggleFilters: () => void;
}

const DebugSessionConfigs = ({
  hasFilters,
  filtersExpanded,
  onToggleFilters,
}: DebugSessionConfigsProps) => {
  const { timeRange, setTimeRange, configs, setConfigs } =
    useDebugSessionLayout();
  const [expanded, setExpanded] = useState(false);
  const { tabIndex, expandAll, collapseAll } = useDebugSession();

  const handleChange = (configName: string, value: boolean) => {
    setConfigs((prev) => ({ ...prev, [configName]: value }));
  };
  const onToggleExpanded = () => {
    setExpanded(!expanded);
    if (expanded) {
      collapseAll();
    } else {
      expandAll();
    }
  };
  const isAllOrTraces = useMemo(
    () =>
      tabIndex === SessionTabIndex.All || tabIndex === SessionTabIndex.Traces,
    [tabIndex]
  );

  return (
    <Flex gap="2" alignItems="center">
      <ConfigButton
        label="Filters"
        onClick={onToggleFilters}
        isActive={filtersExpanded}
        icon={hasFilters ? FilterActiveIcon : FilterIcon}
      />
      <Visibility hideBelow="md">
        {!!timeRange && (
          <ConfigButton
            label="Reset selection"
            icon={ResetTimeIcon}
            onClick={() => setTimeRange(null)}
          />
        )}
        {isAllOrTraces && (
          <>
            <ConfigButton
              label="Timeline"
              icon={TimelineIcon}
              isActive={configs.tracesTimeline}
              onClick={() =>
                handleChange("tracesTimeline", !configs.tracesTimeline)
              }
            />
            {(configs.isListView ||
              configs.sessionPreviewMode === SessionPreviewMode.None) && (
              <ConfigButton
                label="Waterfall"
                icon={WaterfallIcon}
                isActive={configs.waterfall}
                onClick={() => handleChange("waterfall", !configs.waterfall)}
              />
            )}

            <ConfigButton
              isActive={expanded}
              label={expanded ? "Collapse all" : "Expand all"}
              icon={expanded ? CompressLine : ExpandLine}
              onClick={onToggleExpanded}
            />
          </>
        )}
      </Visibility>
    </Flex>
  );
};

const ConfigButton = ({ label, icon, isActive = false, onClick }) => {
  return (
    <IconButton
      size="sm"
      label={label}
      variant="base"
      borderRadius="base"
      border={isActive ? "1px solid" : "unset"}
      borderColor="#0000000F"
      backgroundColor={isActive ? "bg.subtle" : "unset"}
      icon={<Icon color="muted" as={icon} />}
      onClick={onClick}
    />
  );
};

export default DebugSessionConfigs;
