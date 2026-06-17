import { Flex } from "@chakra-ui/react";
import MultiSelectFilter from "shared/components/MultiSelectFilter";
import { SessionTypeLabels } from "shared/components/DebugSessionTypeBadge/DebugSessionTypeBadge";
import { DebugSessionCreationReasonType } from "@multiplayer/types";
import DebounceSearch from "shared/components/DebounceSearch";
import TagInput from "shared/components/TagInput";

const UserSessionFilters = ({ filters, setFilters }) => {
  const onMultiSelectFilterChange = (newKeyValue: any) => {
    setFilters((prev) => ({
      ...prev,
      params: { ...prev.params, skip: 0 },
      ...newKeyValue,
    }));
  };

  const onQueryChange = (query) => {
    setFilters((prev) => ({
      ...prev,
      params: { ...prev.params, skip: 0 },
      query,
    }));
  };

  const onTagChange = (tags: string[]) => {
    setFilters((prev) => ({
      ...prev,
      params: { ...prev.params, skip: 0 },
      tags: tags.map((tag) => (tag.split(":").length === 1 ? `:${tag}` : tag)),
    }));
  };

  return (
    <Flex gap="2" alignItems="center" justifyContent="space-between">
      <Flex gap="2" alignItems="center">
        <MultiSelectFilter
          menuPlacement="bottom-start"
          options={Object.keys(SessionTypeLabels).map((key: string) => ({
            label: SessionTypeLabels[key],
            value: key,
          }))}
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
          options={Object.values(DebugSessionCreationReasonType).map((val) => ({
            label: val.toString().toLowerCase(),
            value: val,
          }))}
          selection={filters.creationReason as any}
          setSelection={(selectionKey, newSelection) => {
            onMultiSelectFilterChange({ [selectionKey]: newSelection });
          }}
          selectionKey="creationReason"
          filterName="Creation Type"
          selectionMode="single"
        />
        <TagInput
          autoFocus={false}
          value={filters.tags}
          inputPlaceholder="Search by tag"
          boxProps={{ width: "auto" }}
          onChange={onTagChange}
        />
      </Flex>
      <DebounceSearch
        onSearch={onQueryChange}
        inputGroupProps={{ width: "250px", my: 0, ml: "auto" }}
        inputProps={{
          placeholder: "Start searching...",
          defaultValue: filters.query,
        }}
      />
    </Flex>
  );
};

export default UserSessionFilters;
