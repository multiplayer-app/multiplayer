import { useEffect, useMemo, useState } from "react";
import { IEntity } from "@multiplayer/types";
import { Box, Flex } from "@chakra-ui/react";

import DebounceSearch from "shared/components/DebounceSearch/DebounceSearch";
import { sortAlphabetically } from "shared/helpers/general.helpers";
import EntityItem from "./EntityItem";

const EntityList = ({ entities, activeEntityId, selected }) => {
  const [query, setQuery] = useState("");

  const list = useMemo(
    () =>
      entities &&
      entities
        .filter((entity) => {
          return (
            !entity.key ||
            entity.key.toLowerCase().includes(query.toLowerCase())
          );
        })
        .sort((a, b) =>
          sortAlphabetically(a.key.toLowerCase(), b.key.toLowerCase())
        ),
    [entities, query]
  );

  useEffect(() => {
    setQuery("");
  }, [selected]);

  return (
    <Flex flexDir="column" flex="1" minH="0">
      <DebounceSearch onSearch={setQuery} />
      <Box pl="4" pr="3.5" mx="-4" flex="1" overflow="auto">
        {list.map((entity: IEntity) => (
          <EntityItem
            entity={entity}
            key={entity.entityId}
            isActive={entity.entityId === activeEntityId}
          />
        ))}
      </Box>
    </Flex>
  );
};

export default EntityList;
