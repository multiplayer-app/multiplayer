import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as Y from "yjs";
import {
  Box,
  Flex,
  Icon,
  Tab,
  Tabs,
  Input,
  Select,
  Stack,
  HStack,
  TabList,
  TabPanel,
  TabPanels,
  Textarea,
  FormLabel,
  IconButton,
  FormControl,
  useDisclosure,
} from "@chakra-ui/react";
import {
  ITag,
  Platform,
  EntityVisibility,
  EntityTypeToNameMap,
  EntityVisibilityToNameMap,
  ThreadCreatePayload,
  CommentCreatePayload,
  SortOrder,
} from "@multiplayer/types";

import {
  MultiplayerStateProvider,
  useMultiplayerStateContext,
} from "shared/providers/MultiplayerStateContext";

import Title from "shared/components/Title";
import Threads from "shared/components/Threads";
import TagInput from "shared/components/TagInput";
import NodeIcon from "shared/components/NodeIcon";
import LazyContent, { lazyModule } from "shared/components/LazyContent";
import ThreadForm from "shared/components/Thread/ThreadForm";

import Drawer, { DrawerContent } from "shared/components/Drawer/Drawer";
import ThreadActionsRow from "shared/components/Thread/ThreadActionsRow";
import { ThreadsProvider, useThreads } from "shared/providers/ThreadsContext";

import useMessage from "shared/hooks/useMessage";
import useYMapState from "shared/hooks/useYMapState";
import { EntityCategories } from "shared/models/enums";
import { EntityWithMeta } from "shared/models/interfaces";
import useYUndoManager from "shared/hooks/useYUndoManager";
import { useVersion } from "shared/providers/VersionContext";
import { useEntities } from "shared/providers/EntitiesContext";
import { updateEntity } from "shared/services/version.service";
import OpenInTabButton from "shared/components/OpenInTabButton";
import { entityCategoryMap } from "shared/configs/project.configs";
import EditEntityNameModal from "shared/components/EditEntityNameModal";
import { useFullScreenContext } from "shared/providers/FullScreenContext";

import { CloseIcon, InfoCircleIcon, PencilIcon } from "shared/icons";

const DocumentEditor = lazyModule(
  () => import("shared/components/Editors/DocumentEditor")
);

const EntityDetailsDrawer = ({
  onClose,
  entityId,
  entityName,
  entityType,
  readonly = false,
  containerRef = null,
  showNewTabButton = false,
}) => {
  const { projectId } = useParams();
  const { currentBranchId } = useVersion();
  const fullScreen = useFullScreenContext();
  // TODO: remove all containerRef handlings from parent component and use <FullScreenContentContainer>, see example in Platforms.ts
  const parent = containerRef || fullScreen?.contentContainerRef.current;
  const offsetTop = parent?.getBoundingClientRect().top || 0;

  return (
    <Drawer isOpen={!!entityId}>
      <DrawerContent inset={`${offsetTop}px 0 0 auto`} height="auto">
        <Flex justifyContent="space-between" m="4">
          <Flex alignItems="center" gap="4">
            <NodeIcon type={entityType} boxSize="64px" />

            <Flex direction="column">
              <Flex fontSize="lg" fontWeight="semibold" alignItems="center">
                <Box mr="8px">{entityName}</Box>
              </Flex>
              <Box color="muted" fontSize="sm" fontWeight="500">
                {EntityTypeToNameMap[entityType]}
              </Box>
            </Flex>
          </Flex>
          <Box minW="10">
            {showNewTabButton && (
              <OpenInTabButton id={entityId} type={entityType} />
            )}
            <IconButton
              size="sm"
              variant="base"
              aria-label="close"
              icon={<CloseIcon />}
              onClick={onClose}
            />
          </Box>
        </Flex>
        <MultiplayerStateProvider
          entityId={entityId}
          projectId={projectId}
          entityType={entityType}
          branchId={currentBranchId}
        >
          <ThreadsProvider branchId={currentBranchId} objectId={entityId}>
            <EntityDetails
              readonly={readonly}
              entityType={entityType}
              currentBranchId={currentBranchId}
            />
          </ThreadsProvider>
        </MultiplayerStateProvider>
      </DrawerContent>
    </Drawer>
  );
};

const EntityDetails = ({ entityType, readonly, currentBranchId }) => {
  const editNameModalDisclosure = useDisclosure();
  const entityInfo = useRef<Y.Map<any>>();
  const metadataRef = useRef<Y.Map<any>>();
  const infoRef = useRef<Y.Map<any>>();

  const { doc, provider } = useMultiplayerStateContext();
  const { createThread, threads, params } = useThreads();

  entityInfo.current = doc.getMap("object");
  metadataRef.current = entityInfo.current.get("metadata");
  infoRef.current = doc.getMap("information");

  const undoManager = useYUndoManager([
    entityInfo.current,
    doc?.getXmlFragment("description"),
    infoRef.current,
  ]);

  const [nameMap, onNameChange] = useYMapState<{ name: string }>(
    doc.getMap("name")
  );

  const [information, onInfoChange] = useYMapState<Platform["information"]>(
    infoRef.current
  );

  const handleNameChange = (newName: string) => {
    onNameChange("name", newName);
    editNameModalDisclosure.onClose();
  };

  const onChange = (event: any, fieldName: keyof Platform["information"]) => {
    const newValue = event.target.value;
    onInfoChange(fieldName, newValue);
  };

  const onTreadCreate = async (
    data: Partial<ThreadCreatePayload> | CommentCreatePayload
  ) => {
    await createThread(data);
    if (params.sortOrder === SortOrder.ASC) {
      setTimeout(() => {
        const threadItems = document.getElementsByClassName("thread-item");
        if (threadItems?.length) {
          threadItems[threadItems.length - 1].scrollIntoView();
        }
      });
    }
  };

  return (
    <Tabs isLazy minH="0" flex="1" flexDir="column" display="flex">
      <TabList pt="3" bg="bg.primary">
        <Tab key="About">About</Tab>
        <Tab key="Readme">Readme</Tab>
        <Tab key="Comments">
          Comments
          <Flex
            px="1"
            ml="2"
            fontSize="xs"
            bg="bg.subtle"
            color="muted"
            border="1px solid"
            borderRadius="base"
            borderColor="blackAlpha.100"
          >
            {threads.totalComments}
          </Flex>
        </Tab>
      </TabList>
      <TabPanels flex="1" overflow="auto" minH="0">
        <TabPanel>
          <Flex direction="column" gap="10" py="4">
            <Flex direction="column" w="100%">
              <Title icon={InfoCircleIcon}>Information</Title>
              <Stack w="100%" gap="4">
                <HStack gap="4">
                  <FormControl>
                    <FormLabel>Name</FormLabel>
                    <Flex position="relative">
                      {!readonly && (
                        <Icon
                          top="2"
                          right="2"
                          zIndex="1"
                          as={PencilIcon}
                          cursor="pointer"
                          color="muted"
                          aria-label="Edit name"
                          position="absolute"
                          onClick={editNameModalDisclosure.onOpen}
                        />
                      )}
                      <EditEntityNameModal
                        previousName={nameMap.name}
                        shouldShowAliasToggle={false}
                        disclosure={editNameModalDisclosure}
                        onNameChange={handleNameChange}
                      />
                    </Flex>
                    <Input
                      pr="8"
                      isDisabled={true}
                      _disabled={{ opacity: 1, cursor: "default" }}
                      value={nameMap.name}
                      cursor={readonly ? "default" : "pointer"}
                      borderColor="border.primary"
                      onClick={
                        !readonly ? editNameModalDisclosure.onOpen : undefined
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Visibility</FormLabel>
                    <Select
                      fontSize="sm"
                      isDisabled={readonly}
                      _disabled={{ opacity: 1, cursor: "default" }}
                      value={information?.visibility}
                      onChange={(event) => {
                        onChange(event, "visibility");
                      }}
                    >
                      {Object.values(EntityVisibility).map((t) => (
                        <option key={t} value={t}>
                          {EntityVisibilityToNameMap[t]}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>
                <HStack>
                  <FormControl>
                    <FormLabel>Short description</FormLabel>
                    <Textarea
                      rows={3}
                      fontSize="sm"
                      maxLength={125}
                      isDisabled={readonly}
                      _disabled={{ opacity: 1, cursor: "default" }}
                      key="shortDescription"
                      placeholder="Enter short description..."
                      value={information?.shortDescription}
                      onChange={(event) => {
                        onChange(event, "shortDescription");
                      }}
                    />
                  </FormControl>
                </HStack>
                <EntityTags
                  id={provider?.entityId}
                  readonly={readonly}
                  entityCategory={entityCategoryMap[entityType]}
                  onChange={(tags: ITag[]) => {
                    return updateEntity(currentBranchId, provider.entityId, {
                      tags,
                    });
                  }}
                />
              </Stack>
            </Flex>
          </Flex>
        </TabPanel>
        <TabPanel>
          <Flex
            overflow="hidden"
            borderRadius="4"
            position="relative"
            border="1px solid #EDF2F7"
          >
            <LazyContent
              element={
                <DocumentEditor
                  doc={doc}
                  readonly={readonly}
                  provider={provider}
                  undoManager={undoManager.instance.current}
                  fieldName="description"
                />
              }
            />
          </Flex>
        </TabPanel>
        <TabPanel
          key="comments"
          h="full"
          as={Flex}
          justifyContent="space-between"
          direction="column"
        >
          <ThreadActionsRow />
          <Threads />
          <Box borderTop="1px solid" borderTopColor="border.primary" p={4}>
            <ThreadForm onSubmit={onTreadCreate} />
          </Box>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

const EntityTags = ({
  id,
  readonly,
  onChange,
  entityCategory,
}: {
  id: string;
  readonly?: boolean;
  entityCategory: EntityCategories;
  onChange: any;
}) => {
  const message = useMessage();
  const { entities } = useEntities();
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const entity: EntityWithMeta = entities[entityCategory].find(
      (e) => e.entityId === id
    );
    setTags(entity?.tags || []);
  }, [entities, entityCategory, id]);

  const handleChange = async (tags: string[]) => {
    try {
      await onChange(
        tags.map((t) => {
          return typeof t === "string" ? { value: t } : t;
        })
      );
      setTags(tags);
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <FormControl>
      <FormLabel>Tags</FormLabel>
      <TagInput
        value={tags}
        autoFocus={false}
        readonly={readonly}
        onChange={handleChange}
      />
    </FormControl>
  );
};

export default EntityDetailsDrawer;
