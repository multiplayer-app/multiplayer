import {
  Box,
  Flex,
  Icon,
  Tag,
  Button,
  Spinner,
  useToken,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalCloseButton,
  Text,
} from "@chakra-ui/react";
import {
  EyeIcon,
  CubeIcon,
  TimeIcon,
  ChangesIcon,
  InfoCircleIcon,
  BranchPointIcon,
  CheckCircleIcon,
  ChevronRightIcon,
} from "shared/icons";
import BranchChanges from "./BranchChanges";
import { useMemo, useState } from "react";
import { useChangesContext } from "shared/providers/ChangesContext";
import { Endpoint, EntityStateStatus } from "shared/models/enums";
import FooterActions from "./FooterActionButtons";
import PageLoading from "shared/components/PageLoading";
import ChangesPresenceUsers from "../ChangesPresenceUsers";
import { EntityTypeToNameMap } from "@multiplayer/types";

const BranchComparisonView = ({ isActive, onMergeDone }) => {
  const {
    entityIds,
    isLoading,
    conflicts,
    aliasConflicts,
    sourceBranch,
    targetBranch,
    sourceChanges,
    targetChanges,
    onSelect,
  } = useChangesContext();

  const [hovered, setHovered] = useState<string>();
  const [gray600] = useToken("colors", ["muted"]);
  const [conflictsOnly, setConflictsOnly] = useState<boolean>(false);

  const ids = useMemo(
    () => (!conflictsOnly ? entityIds : Array.from(conflicts)),
    [conflictsOnly, conflicts, entityIds]
  );

  return (
    <Flex
      h="full"
      inset="0"
      position="absolute"
      direction="column"
      transition="transform .3s linear"
      transform={isActive ? "translateX(0)" : "translateX(-100%)"}
    >
      <ModalHeader
        gap="2"
        minH="20"
        as={Flex}
        fontSize="lg"
        borderBottom="1px"
        alignItems="center"
        borderBottomColor="border.primary"
      >
        <Icon
          p="0.5"
          boxSize="6"
          color="inverse"
          bg="brand.500"
          rounded="base"
          as={ChangesIcon}
        />
        Changes
        <ChangesPresenceUsers />
        <ModalCloseButton position="static" />
      </ModalHeader>
      <ModalBody bg="bg.surface" overflow="auto" py="4" position="relative">
        {!!conflicts.size && (
          <Flex gap="2" ml="10">
            <Button
              bg="bg.subtle"
              variant="base"
              rounded="full"
              leftIcon={<Icon as={CubeIcon} />}
              boxShadow={!conflictsOnly && `0 0 0 1px ${gray600}`}
              borderColor={conflictsOnly ? "border.secondary" : "muted"}
              onClick={() => setConflictsOnly(false)}
            >
              All changes
            </Button>
            <Button
              variant="base"
              bg="bg.subtle"
              rounded="full"
              leftIcon={
                <Tag
                  size="sm"
                  bg="#FCEDEB"
                  border="1px"
                  color="red.500"
                  rounded="full"
                  borderColor="blackAlpha.50"
                >
                  {conflicts.size}
                </Tag>
              }
              borderColor={conflictsOnly ? "muted" : "border.secondary"}
              boxShadow={conflictsOnly && `0 0 0 1px ${gray600}`}
              onClick={() => setConflictsOnly(true)}
            >
              Conflicts
            </Button>
          </Flex>
        )}
        {!!aliasConflicts.length && (
          <Flex ml={8} direction="column" alignItems="flex-start">
            {aliasConflicts.map((conflict) => (
              <Button
                key={conflict.alias}
                variant="base"
                cursor="default"
                size="sm"
                leftIcon={<Icon as={InfoCircleIcon} color="red.500" />}
              >
                <Text noOfLines={1}>
                  "{conflict.alias}" alias is used in multiple{" "}
                  {EntityTypeToNameMap[
                    conflict.duplicates[0].type
                  ].toLowerCase()}
                  s
                </Text>
              </Button>
            ))}
          </Flex>
        )}
        <Flex gap="6">
          <ChangeRowActions
            ids={ids}
            hovered={hovered}
            onSelect={onSelect}
            onHover={setHovered}
          />
          <BranchChanges
            ids={ids}
            hovered={hovered}
            branch={sourceBranch}
            changes={sourceChanges}
            endpoint={Endpoint.SOURCE}
            onClick={onSelect}
            onHover={setHovered}
          />
          <BranchChanges
            ids={ids}
            hovered={hovered}
            branch={targetBranch}
            changes={targetChanges}
            endpoint={Endpoint.TARGET}
            onClick={onSelect}
            onHover={setHovered}
          />
        </Flex>
        {isLoading && <PageLoading bg="whiteAlpha.800" />}
      </ModalBody>
      <ModalFooter
        borderTop="1px"
        borderTopColor="border.primary"
        justifyContent="flex-start"
        alignItems="center"
      >
        <Flex alignItems="center" gap="4" mr="auto">
          <Flex alignItems="center" gap="2">
            <Icon as={BranchPointIcon} />
            {sourceBranch.name}
          </Flex>
          <Icon as={ChevronRightIcon} />
          <Flex alignItems="center" gap="2">
            <Icon as={BranchPointIcon} />
            {targetBranch.name}
          </Flex>
        </Flex>
        <FooterActions onMergeDone={onMergeDone} />
      </ModalFooter>
    </Flex>
  );
};

const ChangeRowActions = ({ ids, hovered, onHover, onSelect }) => {
  const { states, conflicts, staged } = useChangesContext();

  const isResolved = (id: string) => {
    const stage = staged[id];
    return stage && (stage.source.status || stage.target.status);
  };

  return (
    <Box
      alignSelf="flex-end"
      w="10"
      py="4"
      mr="-6"
      transform="translateX(1px)"
      position="relative"
    >
      {ids.map((id) => {
        const { status, hasConflicts } = states.get(id);
        return (
          <Box
            h="9"
            key={id}
            lineHeight="9"
            cursor="pointer"
            onClick={() => onSelect(id)}
            onPointerEnter={() => onHover(id)}
            onPointerLeave={() => onHover(null)}
          >
            {status === EntityStateStatus.FETCHING ? (
              <Spinner size="sm" color="brand.500" />
            ) : hovered === id ? (
              <Icon as={EyeIcon} />
            ) : conflicts.has(id) && status === EntityStateStatus.WAITING ? (
              <Icon as={TimeIcon} />
            ) : hasConflicts ? (
              isResolved(id) ? (
                <Icon as={CheckCircleIcon} color="green.500" />
              ) : (
                <Icon as={InfoCircleIcon} color="red.500" />
              )
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
};

export default BranchComparisonView;
