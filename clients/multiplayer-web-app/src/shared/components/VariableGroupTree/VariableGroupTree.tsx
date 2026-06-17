import { useMemo, useState } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { VariableGroup } from "@multiplayer/types";

import DebounceSearch from "shared/components/DebounceSearch";
import VariableGroupTreeNode from "shared/components/VariableGroupTreeNode";

const VariableGroupTree = ({
  data,
  selectedGroup,
  onOpen,
  onChange,
  onOpenAddModal,
  onNameUpdate,
  readonly,
}) => {
  const [query, setQuery] = useState("");

  const onDelete = (groupId: string, parentId?: string) => {
    onChange(groupId, undefined, parentId);
  };

  const filteredData = useMemo(() => {
    if (!query) {
      return data ? [data] : [];
    }

    const recursiveFilter = (group: VariableGroup): VariableGroup | null => {
      const filteredGroups: Record<string, VariableGroup> = {};

      if (group.groups) {
        for (const [key, value] of Object.entries(group.groups)) {
          const filtered = recursiveFilter(value);
          if (filtered) {
            filteredGroups[key] = filtered;
          }
        }
      }

      const hasMatchingChildren = Object.keys(filteredGroups).length > 0;
      const isMatchingSelf = filteringFn(group, query);

      if (isMatchingSelf || hasMatchingChildren) {
        return {
          ...group,
          groups:
            isMatchingSelf || hasMatchingChildren ? filteredGroups : undefined,
        };
      }

      return null;
    };

    const result = data ? recursiveFilter(data) : null;
    return result ? [result] : [];
  }, [data, query]);

  const selectedGroupId = useMemo(
    () =>
      filteredData.length && filteredData[0].groups ? selectedGroup?.id : null,
    [filteredData, selectedGroup]
  );

  return (
    <>
      {data && (
        <DebounceSearch onSearch={setQuery} inputGroupProps={{ mt: 0 }} />
      )}
      <Box overflowY="auto" minW="300px" flex="1">
        {!!filteredData.length ? (
          filteredData.map((group) => (
            <VariableGroupTreeNode
              selectedGroupId={selectedGroupId}
              key={group.name}
              group={group}
              onDelete={onDelete}
              parentId={null}
              onOpen={onOpen}
              readonly={readonly}
              onNameUpdate={onNameUpdate}
              onOpenAddModal={onOpenAddModal}
            />
          ))
        ) : (
          <Flex color="muted" p="4" m="auto" justifyContent="center">
            No variables group found
          </Flex>
        )}
      </Box>
    </>
  );
};

const filteringFn = (group: VariableGroup, query: string) =>
  group.name.toLowerCase().includes(query.toLowerCase());

export default VariableGroupTree;
