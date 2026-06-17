import { Box, Flex, IconButton, SimpleGrid } from "@chakra-ui/react";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import DebounceSearch from "shared/components/DebounceSearch";
import MultiSelectFilter from "shared/components/MultiSelectFilter";
import DateRangePicker from "shared/components/DateRangePicker";
import { SEVERITY_OPTIONS } from "../Severity";
import { ISSUE_STATUS_OPTIONS } from "shared/utils";
import { useParams } from "react-router-dom";
import { getRadarDetections } from "shared/services/radar.service";
import { RadarDetectionType } from "@multiplayer/types";
import Icon from "shared/components/Icon";
import { useVisibility } from "shared/components/Visibility";

interface IssuesFiltersProps extends PropsWithChildren {
  filters: any;
  setFilters: any;
}
const IssuesFilters = ({
  filters,
  children,
  setFilters,
}: IssuesFiltersProps) => {
  const { workspaceId, projectId } = useParams();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const isDesktop = useVisibility({ base: false, lg: true });
  const [services, setServices] = useState<{ label: string; value: string }[]>(
    []
  );
  const [environments, setEnvironments] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [services, environments] = await Promise.all([
          getRadarDetections(workspaceId, projectId, {
            type: RadarDetectionType.SERVICE,
          }),
          getRadarDetections(workspaceId, projectId, {
            type: RadarDetectionType.ENVIRONMENT,
          }),
        ]);
        setServices(
          services.data.map((service: any) => ({
            label: service.componentName,
            value: service.componentName,
          }))
        );
        setEnvironments(
          environments.data.map((env) => ({
            label: env.environmentNames[0],
            value: env.environmentNames[0],
          }))
        );
      } catch (_) {}
    };

    fetchData();
  }, []);

  const onStatusChange = (selectionKey: string, newSelection: any[]) => {
    setFilters((prev: any) => {
      const newFilters = {
        ...prev,
        skip: 0,
      };
      delete newFilters.resolved;
      delete newFilters.archived;

      newSelection.forEach((status) => {
        if (status.value === "resolved") {
          newFilters.resolved = true;
        } else if (status.value === "archived") {
          newFilters.archived = true;
        }
      });
      return newFilters;
    });
  };

  const currentStatus = useMemo(() => {
    const status = [];
    if (filters.resolved === true) status.push(ISSUE_STATUS_OPTIONS.resolved);
    if (filters.archived === true) status.push(ISSUE_STATUS_OPTIONS.archived);
    return status;
  }, [filters]);

  const onQueryChange = (text: string) => {
    setFilters((prev: any) => ({
      ...prev,
      skip: 0,
      text,
    }));
  };

  const onSeverityChange = (selectionKey: string, newSelection: any[]) => {
    setFilters((prev: any) => ({
      ...prev,
      skip: 0,
      severity: newSelection,
    }));
  };

  const onDateRangeChange = (range: any) => {
    setFilters((prev: any) => ({
      ...prev,
      skip: 0,
      lastSeen: range,
    }));
  };

  const onDetectedComponentChange = (
    selectionKey: string,
    newSelection: any[]
  ) => {
    setFilters((prev: any) => ({
      ...prev,
      skip: 0,
      [selectionKey]: newSelection,
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
          <MultiSelectFilter
            menuPlacement="bottom-start"
            options={services}
            selectionMode="single"
            selection={filters["service.serviceNameSlug"]}
            setSelection={onDetectedComponentChange}
            selectionKey="service.serviceNameSlug"
            capitalizeLabels={false}
            filterName="Component"
          />
          <MultiSelectFilter
            menuPlacement="bottom-start"
            selectionMode="single"
            setSelection={onDetectedComponentChange}
            options={environments}
            selection={filters["service.environmentSlug"]}
            selectionKey="service.environmentSlug"
            capitalizeLabels={false}
            filterName="Environment"
          />
          <MultiSelectFilter
            menuPlacement="bottom-start"
            options={Object.values(ISSUE_STATUS_OPTIONS)}
            selection={currentStatus}
            setSelection={onStatusChange}
            selectionKey="status"
            filterName="Status"
          />
          <MultiSelectFilter
            menuPlacement="bottom-start"
            selectionMode="single"
            options={Object.values(SEVERITY_OPTIONS)}
            selection={filters.severity}
            setSelection={onSeverityChange}
            selectionKey="severity"
            filterName="Severity"
          />
          <DateRangePicker
            value={filters.lastSeen}
            onChange={onDateRangeChange}
            placeholder="Time range"
          />
        </Box>
      )}
      <Flex
        gap={2}
        alignItems="center"
        ml={{ base: 0, lg: "auto" }}
        justifyContent="space-between"
      >
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
            defaultValue: filters.text,
          }}
        />
        {children}
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

export default IssuesFilters;
