import { useState } from "react";
import { Box, Flex, IconButton, SimpleGrid } from "@chakra-ui/react";

import { DebugSessionCreationReasonType } from "@multiplayer/types";

import DebounceSearch from "shared/components/DebounceSearch";
import { UseDebugSessionsFiltersReturnType } from "shared/hooks/useDebugSessionsFilters";
import { PropsWithChildren } from "react";
import { SessionTypeLabels } from "shared/components/DebugSessionTypeBadge/DebugSessionTypeBadge";
import { DeviceTypeEnum } from "shared/models/enums";
import Icon from "../Icon";
import MultiSelectFilter from "../MultiSelectFilter";
import StarCheckbox from "../StarCheckbox";
import TagInput from "../TagInput";
import { useVisibility } from "../Visibility";

interface DebugSessionsFiltersProps extends PropsWithChildren {
  collapseOnBase?: boolean;
  filters: UseDebugSessionsFiltersReturnType["filters"];
  setFilters: UseDebugSessionsFiltersReturnType["setFilters"];
}

const DebugSessionsFilters = ({
  filters,
  children,
  collapseOnBase = false,
  setFilters,
}: DebugSessionsFiltersProps) => {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const isDesktop = useVisibility({
    base: false,
    lg: !collapseOnBase,
  });

  const onTagChange = (tags: string[]) => {
    setFilters((prev) => ({
      ...prev,
      params: { ...prev.params, skip: 0 },
      tags: tags.map((tag) => (tag.split(":").length === 1 ? `:${tag}` : tag)),
    }));
  };

  const onQueryChange = (query) => {
    setFilters((prev) => ({
      ...prev,
      params: { ...prev.params, skip: 0 },
      query,
    }));
  };

  const onMultiSelectFilterChange = (newKeyValue: any) => {
    setFilters((prev) => ({
      ...prev,
      params: { ...prev.params, skip: 0 },
      ...newKeyValue,
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
      flexDirection={{
        base: "column-reverse",
        lg: !collapseOnBase ? "row" : "column-reverse",
      }}
      position={{ base: "static", lg: !collapseOnBase ? "sticky" : "static" }}
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
            options={sessionTypeOptions}
            selection={filters.sessionType as any}
            setSelection={(selectionKey, newSelection) => {
              onMultiSelectFilterChange({ [selectionKey]: newSelection });
            }}
            selectionKey="sessionType"
            filterName="Recording Mode"
            selectionMode="single"
          />
          <MultiSelectFilter
            menuPlacement="bottom-start"
            options={creationTypeOptions}
            selection={filters.creationReason}
            setSelection={(selectionKey, newSelection) => {
              onMultiSelectFilterChange({ [selectionKey]: newSelection });
            }}
            selectionKey="creationReason"
            filterName="Creation Type"
          />
          <MultiSelectFilter
            menuPlacement="bottom-start"
            options={deviceTypeOptions}
            selection={filters.device as any}
            setSelection={(selectionKey, newSelection) => {
              onMultiSelectFilterChange({ [selectionKey]: newSelection });
            }}
            selectionKey="device"
            filterName="Device"
            selectionMode="single"
          />
          <StarCheckbox
            starred={filters.starred}
            toggleStarred={() =>
              onMultiSelectFilterChange({ starred: !filters.starred })
            }
          />
          <TagInput
            value={filters.tags}
            inputPlaceholder="Search by tag"
            boxProps={{ width: "auto", flex: 0 }}
            onChange={onTagChange}
          />
        </Box>
      )}
      <Flex
        gap={2}
        alignItems="center"
        ml={{ base: 0, lg: !collapseOnBase ? "auto" : 0 }}
        justifyContent="space-between"
      >
        <DebounceSearch
          onSearch={onQueryChange}
          inputGroupProps={{
            my: 0,
            ml: { base: 0, lg: !collapseOnBase ? "auto" : 0 },
            mr: { base: "auto", lg: 0 },
            width: { base: "auto", lg: "250px" },
          }}
          inputProps={{
            placeholder: "Start searching...",
            defaultValue: filters.query,
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

const creationTypeOptions = Object.values(DebugSessionCreationReasonType).map(
  (val) => ({
    label: val.toString().toLowerCase(),
    value: val,
  })
);

const deviceTypeOptions = Object.values(DeviceTypeEnum).map((val) => ({
  label: val.toString().toLowerCase(),
  value: val,
}));

const sessionTypeOptions = Object.keys(SessionTypeLabels).map(
  (key: string) => ({
    label: SessionTypeLabels[key],
    value: key,
  })
);

export default DebugSessionsFilters;
