import { useState } from "react";
import { Badge, Button, Flex, HStack, Text, Tooltip } from "@chakra-ui/react";
import {
  IAgent,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

import ApiKeysSettingsLink from "shared/components/ApiKeysSettingsLink";
import Visibility from "shared/components/Visibility";
import Icon from "shared/components/Icon";

import WorkersDrawer from "./WorkersDrawer";
import CheckAccess from "shared/components/CheckAccess";

interface AgentsHeaderProps {
  workers: IAgent[];
  onCreateChat: () => void;
}

const AgentsHeader = ({ workers, onCreateChat }: AgentsHeaderProps) => {
  const [isWorkersDrawerOpen, setIsWorkersDrawerOpen] = useState(false);

  // const activeWorkersCount = workers.filter(
  //   (w) => (w.issuesInProgress ?? 0) > 0
  // ).length;

  return (
    <>
      <Flex
        gap="2"
        py="4"
        px={{ base: "4", lg: "10" }}
        direction={{ base: "column", lg: "row" }}
        alignItems={{ base: "flex-start", lg: "center" }}
        justifyContent={{ base: "flex-start", lg: "space-between" }}
      >
        <Text fontSize="24px" fontWeight="600">
          Agent sessions
        </Text>

        <HStack alignItems="center" alignSelf="flex-start" spacing="2">
          <CheckAccess
            scope={RoleType.PROJECT}
            permission={RoleAccessAction.CREATE}
            entity={RoleProjectPermissionEntity.AGENT_CHAT}
          >
            <Tooltip
              label={
                !workers.length
                  ? "There are no workers to create a session for"
                  : undefined
              }
              isDisabled={workers.length > 0}
            >
              <Button onClick={onCreateChat} isDisabled={!workers.length}>
                Create session
              </Button>
            </Tooltip>
          </CheckAccess>
          <Button
            variant="light"
            leftIcon={<Icon name="Bot" boxSize="18px" />}
            onClick={() => setIsWorkersDrawerOpen(true)}
            rightIcon={
              <Badge
                px="2"
                py="1"
                variant="subtle"
                colorScheme="blue"
                borderRadius="full"
              >
                {workers.length}
              </Badge>
            }
          >
            Workers
          </Button>

          <Visibility hideBelow="md">
            <ApiKeysSettingsLink variant="light" />
          </Visibility>
        </HStack>
      </Flex>
      <WorkersDrawer
        workers={workers}
        isOpen={isWorkersDrawerOpen}
        onClose={() => setIsWorkersDrawerOpen(false)}
      />
    </>
  );
};

export default AgentsHeader;
