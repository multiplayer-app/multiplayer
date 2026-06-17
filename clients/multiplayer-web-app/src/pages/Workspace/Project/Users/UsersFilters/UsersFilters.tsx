import { Box, Flex, IconButton, SimpleGrid } from "@chakra-ui/react";
import DebounceSearch from "shared/components/DebounceSearch";
import MultiSelectFilter from "shared/components/MultiSelectFilter";
import DateRangePicker from "shared/components/DateRangePicker/DateRangePicker";
import { PropsWithChildren, useMemo, useState } from "react";
import Icon from "shared/components/Icon";
import { UserStatus } from "shared/models/enums";
import { useVisibility } from "shared/components/Visibility";
import { EndUserType } from "@multiplayer/types";

interface UsersFiltersProps extends PropsWithChildren {
  tableData: any;
  filters: any;
  setFilters: any;
}

const statusOptions = [
  { label: "Active", value: UserStatus.ACTIVE },
  { label: "Inactive", value: UserStatus.INACTIVE },
];

const typeOptions = [
  { label: "Users", value: EndUserType.USER },
  { label: "Visitors", value: EndUserType.VISITOR },
  { label: "API Clients", value: EndUserType.API_CLIENT },
];

const UsersFilters = ({
  tableData,
  filters,
  setFilters,
  children,
}: UsersFiltersProps) => {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const isDesktop = useVisibility({ base: false, lg: true });

  const onQueryChange = (text: string) => {
    setFilters((prev: any) => ({ ...prev, skip: 0, text }));
  };

  const onMultiSelectFilterChange = (newKeyValue: any) => {
    setFilters((prev) => ({
      ...prev,
      skip: 0,
      ...newKeyValue,
    }));
  };

  const onDateRangeChange = (range: any) => {
    setFilters((prev: any) => ({ ...prev, skip: 0, lastSeen: range }));
  };

  const { allTags, allCompanies, allEnvironments } = useMemo(() => {
    const tagsSet = new Set<string>();
    const companiesMap = new Map<string, { label: string; value: string }>();
    const environmentsMap = new Map<string, { label: string; value: string }>();

    Object.values(tableData).forEach((item: any) => {
      const { tags, orgName, environment } = item.attributes;

      tags?.forEach((tag: any) => {
        const value = typeof tag === "string" ? tag : tag.value;
        tagsSet.add(value);
      });

      if (orgName) {
        companiesMap.set(orgName, { label: orgName, value: orgName });
      }

      if (environment) {
        environmentsMap.set(environment, {
          label: environment,
          value: environment,
        });
      }
    });

    const allTags = Array.from(tagsSet).map((tag) => ({
      label: tag,
      value: tag,
    }));

    const allCompanies = Array.from(companiesMap.values());
    const allEnvironments = Array.from(environmentsMap.values());

    return { allTags, allCompanies, allEnvironments };
  }, [tableData]);

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
            options={typeOptions}
            selection={filters.type as any}
            setSelection={(selectionKey, newSelection) => {
              onMultiSelectFilterChange({ [selectionKey]: newSelection });
            }}
            selectionKey="type"
            filterName="Type"
            selectionMode="single"
          />
          <MultiSelectFilter
            menuPlacement="bottom-start"
            options={allCompanies}
            selection={filters.company as any}
            setSelection={(selectionKey, newSelection) => {
              onMultiSelectFilterChange({ [selectionKey]: newSelection });
            }}
            selectionKey="company"
            filterName="Organization"
            selectionMode="single"
          />
          <MultiSelectFilter
            menuPlacement="bottom-start"
            options={allEnvironments}
            selection={filters.environment as any}
            setSelection={(selectionKey, newSelection) => {
              onMultiSelectFilterChange({ [selectionKey]: newSelection });
            }}
            selectionKey="environment"
            filterName="Environment"
            selectionMode="single"
          />
          <MultiSelectFilter
            menuPlacement="bottom-start"
            options={allTags}
            searchable={true}
            selection={filters.tags}
            setSelection={(selectionKey, newSelection) => {
              onMultiSelectFilterChange({ [selectionKey]: newSelection });
            }}
            selectionKey="tags"
            filterName="Tags"
          />
          <MultiSelectFilter
            menuPlacement="bottom-start"
            options={statusOptions}
            selection={filters.status}
            setSelection={(selectionKey, newSelection) => {
              onMultiSelectFilterChange({ [selectionKey]: newSelection });
            }}
            selectionKey="status"
            filterName="Status"
            selectionMode="single"
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

export default UsersFilters;
