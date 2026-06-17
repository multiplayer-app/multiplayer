import { Flex } from "@chakra-ui/react";
import TagInput from "shared/components/TagInput";
import DebounceSearch from "shared/components/DebounceSearch";
import { IProjectConfig, ITableSorting } from "shared/models/interfaces";
import Visibility from "shared/components/Visibility";

interface EntityFiltersProps {
  config: IProjectConfig;
  filters: {
    query: string;
    tags: string[];
    sorting: ITableSorting;
  };
  setFilters: (filters: any) => void;
}

const EntityFilters = ({ config, filters, setFilters }: EntityFiltersProps) => {
  const onTagChange = (tags) => {
    setFilters({
      ...filters,
      tags: tags.map((tag) => (tag.split(":").length === 1 ? `:${tag}` : tag)),
    });
  };

  const onQueryChange = (query) => {
    setFilters({
      ...filters,
      query,
    });
  };

  return (
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
      <Visibility hideBelow="md">
        <Flex gap={2} alignItems="center">
          <TagInput
            value={filters.tags}
            autoFocus={false}
            inputPlaceholder="Search by tag"
            boxProps={{ width: "auto" }}
            onChange={onTagChange}
          />
        </Flex>
      </Visibility>
      <DebounceSearch
        onSearch={onQueryChange}
        inputGroupProps={{ width: "250px", my: 0 }}
        inputProps={{
          placeholder: `Search ${config.name.toLowerCase()}...`,
          defaultValue: filters.query,
        }}
      />
    </Flex>
  );
};

export default EntityFilters;
