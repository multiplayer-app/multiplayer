import {
  Menu,
  Icon,
  MenuList,
  MenuItem,
  MenuButton,
  BreadcrumbLink,
  Portal,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DebounceSearch from "shared/components/DebounceSearch";
import { sortAlphabetically } from "shared/helpers/general.helpers";
import { ChevronDownIcon } from "shared/icons";
import { ProjectSourceType } from "shared/models/enums";
import { useEntities } from "shared/providers/EntitiesContext";

const EntityBreadcrumbItem = ({ category, path }) => {
  const { entity, entities } = useEntities();
  if (!entity) return null;
  return (
    <Menu isLazy autoSelect={false}>
      <MenuButton
        display="flex"
        alignItems="center"
        textDecoration="none"
        as={BreadcrumbLink}
      >
        {entity.key}
        <Icon as={ChevronDownIcon} ml="2" boxSize="4" />
      </MenuButton>
      <Portal>
        <MenuList maxH="300px" pt="0" overflowY="auto" zIndex={1000}>
          <EntitiesList entities={entities} category={category} path={path} />
        </MenuList>
      </Portal>
    </Menu>
  );
};

const EntitiesList = ({ entities, category, path }) => {
  const [query, setQuery] = useState("");
  const filteredEntities = useMemo(() => {
    return entities[category]
      .filter(
        (entity) =>
          !entity.default &&
          entity.key.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) =>
        sortAlphabetically(a.key.toLowerCase(), b.key.toLowerCase())
      );
  }, [entities, category, query]);

  return (
    <>
      <DebounceSearch
        onSearch={setQuery}
        inputGroupProps={{
          mt: "0",
          mb: "1",
          top: "0",
          zIndex: 10,
          bg: "bg.primary",
          position: "sticky",
          boxShadow: "0 -6px 0 10px var(--chakra-colors-bg-primary)",
        }}
      />
      {filteredEntities.map((entity) => {
        const entityPath = `${ProjectSourceType.ENTITY}/${entity.type}/${entity.entityId}`;
        const isActive = path === entity.entityId;
        return (
          <MenuItem
            key={entity.entityId}
            as={Link}
            to={entityPath}
            position="relative"
            borderRadius="base"
            bg={isActive ? "bg.subtle" : "transparent"}
            _before={
              isActive
                ? {
                    content: "''",
                    w: 0.5,
                    mr: "7px",
                    top: "1.5",
                    bottom: "1.5",
                    left: "-5px",
                    bg: "brand.500",
                    borderRadius: "base",
                    position: "absolute",
                  }
                : null
            }
          >
            {entity.key}
          </MenuItem>
        );
      })}
    </>
  );
};
export default EntityBreadcrumbItem;
