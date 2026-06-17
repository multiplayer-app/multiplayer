import { useEffect } from "react";
import {
  Flex,
  Text,
  Icon,
  Button,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Box,
} from "@chakra-ui/react";
import { ScrollSync } from "react-scroll-sync";

import { EntityCommitChangeType, IProjectBranch } from "@multiplayer/types";
import { ArrowCircleUp, BranchPointIcon, ChevronLeftIcon } from "shared/icons";
import EntityIcon from "shared/components/EntityIcon";
import { IProjectBranchChange } from "shared/models/interfaces";

import EntityViewer from "./EntityViewer";
import { Endpoint, EntityStateStatus, StageStatus } from "shared/models/enums";
import { useChangesContext } from "shared/providers/ChangesContext";
import { SharedStateProvider } from "shared/providers/SharedStateContext";
import ChangesPresenceUsers from "../ChangesPresenceUsers";

interface EntityComparisonViewProps {
  isActive: boolean;
  entityId: string;
  targetBranch: IProjectBranch;
  sourceBranch: IProjectBranch;
  sourceChange: IProjectBranchChange;
  targetChange: IProjectBranchChange;
}

const EntityComparisonView = ({
  isActive,
  entityId,
  targetBranch,
  sourceBranch,
  sourceChange,
  targetChange,
}: EntityComparisonViewProps) => {
  const { states, getEntityState, onSelect } = useChangesContext();

  useEffect(() => {
    const state = states.get(entityId);
    if (entityId && state.status === EntityStateStatus.WAITING) {
      getEntityState(entityId, sourceChange, targetChange);
    }
  }, [entityId, states]);

  return (
    <Flex
      h="full"
      inset="0"
      bg="bg.primary"
      position="absolute"
      direction="column"
      borderRadius="inherit"
      transition="transform .3s linear"
      transform={isActive ? "translateX(0)" : "translateX(100%)"}
    >
      <ModalHeader
        minH="20"
        gap="2"
        as={Flex}
        fontSize="lg"
        borderBottom="1px"
        alignItems="center"
        borderBottomColor="border.primary"
      >
        <Button
          size="sm"
          variant="base"
          tabIndex={isActive ? 0 : -1}
          leftIcon={<Icon as={ChevronLeftIcon} />}
          onClick={() => onSelect(null)}
        >
          Go back
        </Button>

        <ChangesPresenceUsers />
      </ModalHeader>
      <ModalBody bg="bg.surface" overflow="auto" py="4">
        {isActive ? (
          <Flex gap="6" alignItems="stretch" h="full">
            <ScrollSync>
              <SharedStateProvider>
                <EntityContainer
                  branch={sourceBranch}
                  entityInfo={
                    <EntityInfo
                      initial={sourceChange}
                      additional={targetChange}
                    />
                  }
                  change={sourceChange}
                  endpoint={Endpoint.SOURCE}
                  state={states.get(entityId)}
                />
                <EntityContainer
                  branch={targetBranch}
                  entityInfo={
                    <EntityInfo
                      initial={targetChange}
                      additional={sourceChange}
                    />
                  }
                  change={targetChange}
                  endpoint={Endpoint.TARGET}
                  state={states.get(entityId)}
                />
              </SharedStateProvider>
            </ScrollSync>
          </Flex>
        ) : null}
      </ModalBody>
      {sourceChange && targetChange && (
        <ModalFooter borderTop="1px">
          <FooterActions />
        </ModalFooter>
      )}
    </Flex>
  );
};

const EntityContainer = ({ state, endpoint, branch, change, entityInfo }) => {
  return (
    <Flex flex="1" minW="0" direction="column">
      <Button
        my="6"
        w="full"
        size="sm"
        bg="bg.subtle"
        variant="base"
        borderColor="border.secondary"
        justifyContent="flex-start"
        tabIndex={-1}
        leftIcon={<Icon as={BranchPointIcon} />}
      >
        {branch.name}
      </Button>

      <Flex
        flex="1"
        minH="0"
        bg="bg.primary"
        border="1px"
        borderRadius="lg"
        overflow="hidden"
        direction="column"
        position="relative"
        borderColor="border.secondary"
      >
        {entityInfo}
        {!change ? (
          <Text color="muted" textAlign="center" m="auto">
            There is no change
          </Text>
        ) : change.entityCommit.changeType === EntityCommitChangeType.DELETE ? (
          <Text color="muted" textAlign="center" m="auto">
            Entity removed!
          </Text>
        ) : (
          <EntityViewer
            state={state}
            endpoint={endpoint}
            entityType={change.entity.type}
            entityId={change.entity.entityId}
            entityName={change.entityCommit.meta.entityName}
          />
        )}
      </Flex>
    </Flex>
  );
};

const FooterActions = () => {
  const { states, selected, onSelect, stageEntityChange } = useChangesContext();
  const state = states.get(selected);

  if (!state) return null;
  const pickEndpoint = (endpoint, oppEndpoint) => {
    stageEntityChange(selected, (prev) => {
      const updateStatus = (target, status) => {
        if (target) {
          target.status = status;
          Object.keys(target.chunks).forEach((key) => {
            target.chunks[key] = { status };
          });
        }
      };
      updateStatus(prev[endpoint], StageStatus.STAGED);
      updateStatus(prev[oppEndpoint], StageStatus.UNSTAGED);
      return prev;
    });
    onSelect(null);
  };

  return (
    <Flex gap="6" w="full">
      <Box flex="1">
        <Button
          w="full"
          leftIcon={<Icon as={ArrowCircleUp} />}
          onClick={() => pickEndpoint(Endpoint.SOURCE, Endpoint.TARGET)}
        >
          Pick this version
        </Button>
      </Box>
      <Box flex="1">
        <Button
          w="full"
          leftIcon={<Icon as={ArrowCircleUp} />}
          onClick={() => pickEndpoint(Endpoint.TARGET, Endpoint.SOURCE)}
        >
          Pick this version
        </Button>
      </Box>
    </Flex>
  );
  // }
};

const EntityInfo = ({ initial, additional }) => {
  if (!initial && !additional) return null;
  const change = initial || additional;
  const entity = change.entity;

  return (
    <Flex
      px="4"
      py="2"
      gap="2"
      borderBottom="1px"
      alignItems="center"
      borderBottomColor="border.secondary"
    >
      <EntityIcon name={entity.type} />
      <Text>{change.entityCommit.meta.entityName || change.entity.key}</Text>
    </Flex>
  );
};

export default EntityComparisonView;
