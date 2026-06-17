import { Flex, Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import {
  RoleType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import {
  entityCategoryMap,
  projectCategoryConfigs,
} from "shared/configs/project.configs";
import CreateEntity from "shared/components/CreateEntity";
import CheckAccess from "shared/components/CheckAccess";
import { useWorkspace } from "shared/providers/WorkspaceContext";

const EntityDashboardHeader = () => {
  const { type } = useParams();
  const { isPublic } = useWorkspace();
  const category = entityCategoryMap[type as any];
  const categoryConfig = projectCategoryConfigs[category];

  return (
    <Flex
      gap="2"
      py="4"
      justifyContent="space-between"
      flexWrap="wrap"
      alignItems="center"
    >
      <Text fontSize="24px" fontWeight="600">
        {isPublic ? categoryConfig?.publicName : categoryConfig?.name}
      </Text>
      {categoryConfig?.form && (
        <Flex alignSelf="flex-start" gap="2" flexWrap="wrap">
          <CheckAccess
            scope={RoleType.PROJECT}
            permission={RoleAccessAction.CREATE}
            entity={RoleProjectPermissionEntity.ENTITY}
          >
            <CreateEntity type={category} />
          </CheckAccess>
        </Flex>
      )}
    </Flex>
  );
};

export default EntityDashboardHeader;
