import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
} from "@chakra-ui/react";
import { EntityType, EntityTypeToNameMap } from "@multiplayer/types";
import { extractKeyValue } from "@multiplayer/util-shared";

import { environmentDetailsTabs } from "shared/configs/project.configs";
import { InfoCircleIcon, PencilIcon } from "shared/icons";
import { useEntities } from "shared/providers/EntitiesContext";
import PresenceAvatarGroup from "../../PresenceAvatarGroup";
import { EntityWithMeta } from "shared/models/interfaces";
import { EntityCategories } from "shared/models/enums";
import useMessage from "shared/hooks/useMessage";

import LazyContent, { lazyModule } from "../../LazyContent";
import EntityIcon from "../../EntityIcon";
import TagInput from "../../TagInput";
import EditEntityNameModal from "shared/components/EditEntityNameModal";
import { useMultiplayerStateContext } from "shared/providers/MultiplayerStateContext";

const DocumentEditor = lazyModule(
  () => import("shared/components/Editors/DocumentEditor")
);

const EnvironmentEditor = ({
  doc,
  provider,
  name,
  readonly,
  presenceState,
  information,
  undoManager,
  onChange,
  entityName,
}) => {
  const message = useMessage();
  const { entity } = useMultiplayerStateContext();
  const editNameModalDisclosure = useDisclosure();

  const getBorderProps = useCallback(
    (formControlName: string) => {
      if (
        !presenceState ||
        !presenceState[formControlName] ||
        !presenceState[formControlName].length
      ) {
        return "border.secondary";
      }
      return `${
        presenceState[formControlName].length > 1
          ? "border.secondary"
          : presenceState[formControlName][0].color
      }`;
    },
    [presenceState]
  );

  const setFocusedElement = (formControlName: string | null) => {
    provider?.awareness.setLocalStateField("focusedElement", formControlName);
  };

  const getPresentUsers = (formControlName: string) => {
    return presenceState && presenceState[formControlName]
      ? presenceState[formControlName]
      : [];
  };

  const onInfoChange = (event) => {
    onChange("information", event.target.name, event.target.value);
  };

  const handleNameChange = (
    newName: string,
    shouldAddAlias: boolean = false
  ) => {
    onChange("name", "name", newName);
    if (shouldAddAlias) {
      try {
        const newAliases = [...entity.keyAliases, name];
        onChange("keyAliases", "keyAliases", newAliases);
      } catch (err) {
        message.handleError(err);
      }
    }
  };

  const getInputProps = (name: string, type: "select" | "input" = "input") => {
    const baseProps = {
      name,
      fontSize: 14,
      isDisabled: readonly,
      borderColor: getBorderProps(name),
      _disabled: { opacity: 1, cursor: "default" },
    };
    const typeProps = {
      select: {
        value: information[name],
        onChange: onInfoChange,
        onBlur: () => setFocusedElement(null),
        onFocus: () => setFocusedElement(name),
      },
      input: {
        value: information[name],
        onChange: onInfoChange,
        onBlur: () => setFocusedElement(null),
        onFocus: () => setFocusedElement(name),
      },
    };

    return {
      ...baseProps,
      ...(readonly ? { defaultValue: information[name] } : typeProps[type]),
    };
  };

  return (
    <Box p="3" w="full" flex="1" overflow="auto" pt="64px">
      <Box w="full" mx="auto" maxW="848px">
        <Flex alignItems="center" mb="8" gap="4">
          <EntityIcon name={EntityType.ENVIRONMENT} boxSize="100px" />
          <Flex direction="column">
            <Flex fontSize="lg" fontWeight="semibold" alignItems="center">
              <Box mr="8px">{entityName}</Box>
            </Flex>
            <Box color="muted" fontSize="sm" fontWeight="500">
              {EntityTypeToNameMap[EntityType.ENVIRONMENT]}
            </Box>
          </Flex>
        </Flex>
        <Tabs>
          <TabList>
            {environmentDetailsTabs.map((tabName) => (
              <Tab key={tabName}>{tabName}</Tab>
            ))}
          </TabList>
          <TabPanels
            flex="1"
            minH="0"
            display="flex"
            overflow="auto"
            flexDirection="column"
            px="1px"
          >
            <TabPanel
              flex="1"
              minH="0"
              display="flex"
              flexDirection="column"
              p="0"
            >
              <Flex direction="column">
                <Flex direction="column" pl="1px" w="100%" mt="10">
                  <Flex color="muted" mb="4">
                    <Icon as={InfoCircleIcon} mr="4px" color="brand.500" />
                    <Box fontWeight="500" color="brand.500">
                      Information
                    </Box>
                  </Flex>
                  <Stack w="100%" gap="4">
                    <HStack gap="4">
                      <FormControl>
                        <FormLabel>Name</FormLabel>
                        <Box position="absolute" top="0" right="0">
                          <PresenceAvatarGroup
                            users={getPresentUsers("name")}
                          />
                        </Box>
                        {!readonly && (
                          <Flex position="relative">
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
                            <EditEntityNameModal
                              previousName={name}
                              shouldShowAliasToggle={true}
                              disclosure={editNameModalDisclosure}
                              onNameChange={handleNameChange}
                            />
                          </Flex>
                        )}
                        <Input
                          pr="8"
                          value={name}
                          cursor={readonly ? "default" : "pointer"}
                          isDisabled={true}
                          _disabled={{ opacity: 1, cursor: "default" }}
                          borderColor={getBorderProps("name")}
                          onClick={editNameModalDisclosure.onOpen}
                        ></Input>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Slug</FormLabel>
                        <Box position="absolute" top="0" right="0">
                          <PresenceAvatarGroup
                            users={getPresentUsers("slug")}
                          />
                        </Box>
                        <Input
                          key={"slug"}
                          placeholder="Enter a slug..."
                          {...getInputProps("slug")}
                        ></Input>
                      </FormControl>
                    </HStack>
                    <HStack>
                      <FormControl>
                        <FormLabel>Short description</FormLabel>
                        <Box position="absolute" top="0" right="0">
                          <PresenceAvatarGroup
                            users={getPresentUsers("shortDescription")}
                          />
                        </Box>
                        <Input
                          key="shortDescription"
                          placeholder="Enter short description..."
                          maxLength={125}
                          {...getInputProps("shortDescription")}
                        />
                      </FormControl>
                    </HStack>
                    <HStack gap="4">
                      <EnvironmentTags
                        readonly={readonly}
                        objectId={provider?.entityId}
                        onChange={onChange}
                      />
                    </HStack>
                    <HStack gap="4">
                      <ComponentAliases
                        readonly={readonly}
                        objectId={provider?.entityId}
                        onChange={onChange}
                      />
                    </HStack>
                  </Stack>
                </Flex>
              </Flex>
            </TabPanel>
            <TabPanel px="0">
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
                      provider={provider}
                      readonly={readonly}
                      undoManager={undoManager}
                      fieldName="description"
                    />
                  }
                />
              </Flex>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default EnvironmentEditor;

const EnvironmentTags = ({ objectId, onChange, readonly }) => {
  const message = useMessage();
  const { entities } = useEntities();
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const entity: EntityWithMeta = entities[EntityCategories.ENVIRONMENT].find(
      (e) => e.entityId === objectId
    );
    setTags(entity?.tags || []);
  }, [entities, objectId]);

  const handleChange = async (tags: string[]) => {
    try {
      await onChange(
        "tags",
        "tags",
        tags.map((t) => {
          return typeof t === "string" ? extractKeyValue(t) : t;
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

const ComponentAliases = ({ objectId, onChange, readonly }) => {
  const message = useMessage();
  const { entities } = useEntities();
  const [aliases, setAliases] = useState([]);

  useEffect(() => {
    const entity: EntityWithMeta = entities[EntityCategories.ENVIRONMENT].find(
      (e) => e.entityId === objectId
    );
    setAliases(entity?.keyAliases || []);
  }, [entities, objectId]);

  const handleChange = async (aliases: string[]) => {
    try {
      await onChange("keyAliases", "keyAliases", aliases);
      setAliases(aliases);
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <FormControl>
      <FormLabel>Aliases</FormLabel>
      <TagInput
        value={aliases}
        showIcon={false}
        autoFocus={false}
        readonly={readonly}
        objectType="aliases"
        onChange={handleChange}
      />
    </FormControl>
  );
};
