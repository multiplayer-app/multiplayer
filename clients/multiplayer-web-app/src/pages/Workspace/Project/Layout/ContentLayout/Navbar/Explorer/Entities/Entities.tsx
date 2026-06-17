import { projectCategoryConfigs } from "shared/configs/project.configs";
import { useEntities } from "shared/providers/EntitiesContext";
import { Flex, Image } from "@chakra-ui/react";
import CreateEntity from "shared/components/CreateEntity";
import EmptyScreen from "shared/components/EmptyScreen";
import { EntityCategories } from "shared/models/enums";

import EmptyDocs from "assets/images/emptyStates/documents-empty-list.png";
import EmptySources from "assets/images/emptyStates/sources-empty-list.png";
import EmptyPlatforms from "assets/images/emptyStates/platforms-empty-list.png";
import EmptyComponents from "assets/images/emptyStates/components-empty-list.png";
import EmptyRepositories from "assets/images/emptyStates/repositories-empty-list.png";
import EmptyEnvironments from "assets/images/emptyStates/environments-empty-list.png";
import {
  RoleType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import CheckAccess from "shared/components/CheckAccess";
import { useMemo } from "react";
import EntityList from "./EntityList";

const EntityToIllustrationMap = {
  [EntityCategories.REPOSITORY]: EmptyRepositories,
  [EntityCategories.COMPONENT]: EmptyComponents,
  [EntityCategories.PLATFORM]: EmptyPlatforms,
  [EntityCategories.DOCUMENT]: EmptyDocs,
  [EntityCategories.SKETCH]: EmptyDocs,
  [EntityCategories.SOURCE]: EmptySources,
  [EntityCategories.ENVIRONMENT]: EmptyEnvironments,
};

const Entities = ({ selected }) => {
  const { entities, entity } = useEntities();
  const filteredEntities = entities[selected];
  const configs = projectCategoryConfigs[selected];

  const createEntity = useMemo(() => {
    return (
      <CheckAccess
        scope={RoleType.PROJECT}
        permission={RoleAccessAction.CREATE}
        entity={RoleProjectPermissionEntity.ENTITY}
      >
        <CreateEntity type={selected} />
      </CheckAccess>
    );
  }, [selected]);

  return !filteredEntities.length && configs.emptyScreen ? (
    <EmptyScreen
      title={configs.emptyScreen.title}
      description={configs.emptyScreen.description}
      icon={
        <Flex mb="2">
          <Image w="180px" src={EntityToIllustrationMap[selected] || ""} />
        </Flex>
      }
    >
      {createEntity}
    </EmptyScreen>
  ) : (
    <Flex flexDir="column" flex="1" gap="2" minH="0">
      <EntityList
        selected={selected}
        entities={filteredEntities}
        activeEntityId={entity?.entityId}
      />
      {createEntity}
    </Flex>
  );
};

export default Entities;
