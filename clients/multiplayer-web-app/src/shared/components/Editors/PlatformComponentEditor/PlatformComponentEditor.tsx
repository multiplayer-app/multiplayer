import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Blocknote,
  ComponentType,
  ComponentTypeToNameMap,
  EntityCommitChangeType,
} from "@multiplayer/types";
import * as Y from "yjs";
import { extractKeyValue } from "@multiplayer/util-shared";

import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";

import Title from "shared/components/Title";
import useMessage from "shared/hooks/useMessage";
import TagInput from "shared/components/TagInput";
import { ClientState } from "shared/models/interfaces";
import LazyContent, { lazyModule } from "shared/components/LazyContent";
import ComponentIcon from "shared/components/ComponentIcon";
import ComponentColor from "shared/components/ComponentColor";
import MarkdownRenderer from "shared/components/MarkdownRenderer";
import usePlatformComponent from "shared/hooks/usePlatformComponent";
import usePresenceState from "shared/hooks/usePresenceState";
import EditEntityNameModal from "shared/components/EditEntityNameModal";
import PresenceAvatarGroup from "shared/components/PresenceAvatarGroup";
import ChangedInputWrapper from "shared/components/ChangedInputWrapper";
import ChangedSelectWrapper from "shared/components/ChangedSelectWrapper";
import { platformComponentDetailsTabs } from "shared/configs/project.configs";
import { useMultiplayerStateContext } from "shared/providers/MultiplayerStateContext";
import { InfoCircleIcon, PencilIcon } from "shared/icons";

import Releases from "./Releases";

const DocumentEditor = lazyModule(
  () => import("shared/components/Editors/DocumentEditor")
);

const PlatformComponentEditor = ({
  doc,
  provider,
  readonly,
  openedIn,
  clients,
  description,
  showChanges,
  undoManager,
}: {
  doc?: Y.Doc;
  provider?: YjsSocketIOProvider;
  description?: Blocknote.BlockElement;
  openedIn: "tab" | "drawer";
  clients: ClientState[];
  readonly?: boolean;
  undoManager?: Y.UndoManager;
  showChanges?: boolean;
}) => {
  const message = useMessage();
  const { entity } = useMultiplayerStateContext();
  const editNameModalDisclosure = useDisclosure();
  const {
    data,
    name,
    changesDiff,
    onChange,
    releasesLoading,
    onReleasesScrollEnd,
  } = usePlatformComponent({
    doc,
    provider,
    showChanges,
  });
  const { getPresentUsers, presenceState } = usePresenceState(clients);
  const { information, variables, releases } = data;
  const [readme, setReadme] = useState("");

  const setFocusedElement = useCallback(
    (formControlName: string | null) => {
      provider?.awareness.setLocalStateField("focusedElement", formControlName);
    },
    [provider]
  );

  const onInfoChange = useCallback(
    (event: any) => {
      if (!event.target) {
        !!event && onChange("name", "name", event);
      } else {
        onChange("information", event.target.name, event.target.value);
      }
    },
    [onChange]
  );

  const handleNameChange = (
    newName: string,
    shouldAddAlias: boolean = false
  ) => {
    onInfoChange(newName);
    if (shouldAddAlias) {
      try {
        const newAliases = [...entity.keyAliases, name];
        onChange("keyAliases", null, newAliases);
      } catch (err) {
        message.handleError(err);
      }
    }
  };

  const getBorderColor = useCallback(
    (formControlName: string) => {
      if (
        !presenceState ||
        !presenceState[formControlName] ||
        !presenceState[formControlName].length
      ) {
        return "border.secondary";
      }
      return presenceState[formControlName].length > 1
        ? "border.secondary"
        : presenceState[formControlName][0].color;
    },
    [presenceState]
  );

  const getInputProps = useCallback(
    (name: string, type: "select" | "input" = "input") => {
      const baseProps = {
        name,
        fontSize: 14,
        isDisabled: readonly,
        _disabled: { opacity: 1, cursor: "default" },
      };
      // TODO: Remove type checking if it's not needed
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
    },
    [information, readonly, onInfoChange, setFocusedElement]
  );

  const getPreviousValue = useCallback(
    (inputName: string) => {
      return changesDiff?.information && changesDiff?.information[inputName]
        ? changesDiff?.information[inputName][0]
        : "";
    },
    [changesDiff]
  );

  const resetInputValue = (inputName: string) => {
    onInfoChange({
      target: { name: inputName, value: getPreviousValue(inputName) },
    });
  };

  const countByTabName = useMemo(() => {
    return {
      About: "",
      Variables: +Object.keys(variables)?.length + "" || "0",
      Releases: String(releases?.cursor?.total ?? 0),
    };
  }, [variables, releases]);

  const paddingTop = openedIn === "tab" ? "64px" : "4";

  return (
    <Box
      p="3"
      w="full"
      flex="1"
      overflow="auto"
      position="relative"
      pt={paddingTop}
    >
      <Box w="full" mx="auto" maxW="848px">
        <Flex alignItems="center" mb="5" gap="4">
          <ComponentIcon
            readonly={readonly}
            type={information.type}
            iconUrl={information.iconUrl}
            onIconChange={(newUrl) =>
              onChange("information", "iconUrl", newUrl)
            }
            boxSize={openedIn === "tab" ? "100px" : "64px"}
          />

          <Flex direction="column">
            <Flex fontSize="lg" fontWeight="semibold" alignItems="center">
              <Box mr="8px">{name}</Box>
            </Flex>
            <Box color="muted" fontSize="sm" fontWeight="500">
              {ComponentTypeToNameMap[information.type]}
            </Box>
          </Flex>
        </Flex>

        <Tabs isLazy>
          <TabList
            pt="3"
            zIndex="2"
            bg="bg.primary"
            position="sticky"
            top={`-${paddingTop}`}
          >
            {platformComponentDetailsTabs.map((tabName) => (
              <Tab key={tabName}>
                {tabName}
                {!!countByTabName[tabName] && (
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
                    {countByTabName[tabName]}
                  </Flex>
                )}
              </Tab>
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
                  <Title icon={InfoCircleIcon}>Information</Title>
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
                          isDisabled={true}
                          _disabled={{ opacity: 1, cursor: "default" }}
                          borderColor={getBorderColor("name")}
                          onClick={
                            !readonly
                              ? editNameModalDisclosure.onOpen
                              : undefined
                          }
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Type</FormLabel>
                        <Box position="absolute" top="0" right="0">
                          <PresenceAvatarGroup
                            users={getPresentUsers("type")}
                          />
                        </Box>
                        <ChangedSelectWrapper
                          options={Object.values(ComponentType).map((t) => (
                            <option key={t} value={t}>
                              {ComponentTypeToNameMap[t]}
                            </option>
                          ))}
                          selectProps={{ ...getInputProps("type", "select") }}
                          wrapperProps={{
                            changeType:
                              changesDiff?.information?.type &&
                              EntityCommitChangeType.UPDATE,
                            tooltipValue:
                              ComponentTypeToNameMap[getPreviousValue("type")],
                            styleProps: {
                              borderColor: getBorderColor("type"),
                            },
                            onResetValue: () => {
                              resetInputValue("type");
                            },
                          }}
                        />
                      </FormControl>
                    </HStack>
                    <HStack gap="4">
                      <FormControl>
                        <FormLabel>Short description</FormLabel>
                        <Box position="absolute" top="0" right="0">
                          <PresenceAvatarGroup
                            users={getPresentUsers("shortDescription")}
                          />
                        </Box>
                        <ChangedInputWrapper
                          inputProps={{
                            key: "shortDescription",
                            placeholder: !readonly
                              ? "Enter short description..."
                              : "",
                            maxLength: 125,
                            ...getInputProps("shortDescription"),
                          }}
                          wrapperProps={{
                            tooltipValue: getPreviousValue("shortDescription"),
                            changeType:
                              changesDiff?.information?.shortDescription &&
                              EntityCommitChangeType.UPDATE,
                            styleProps: {
                              borderColor: getBorderColor("shortDescription"),
                            },
                            onResetValue: () => {
                              resetInputValue("shortDescription");
                            },
                          }}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Color</FormLabel>
                        <ComponentColor
                          disabled={readonly}
                          readonly={readonly}
                          value={information.color}
                          onChange={(val) =>
                            onChange("information", "color", val)
                          }
                        />
                      </FormControl>
                    </HStack>

                    <ComponentTags
                      readonly={readonly}
                      entity={entity}
                      onChange={onChange}
                    />

                    <ComponentAliases
                      readonly={readonly}
                      entity={entity}
                      onChange={onChange}
                    />
                  </Stack>
                </Flex>

                {/*Todo clicking on the links in code/apis should open the repos and expand to the location of the code/api.
                hide this block until it's done*/}
                {/*<ImplementationsAndAPIs
                  name={name}
                  readonly={readonly}
                  entityId={provider?.entityId}
                  branchId={provider?.branchId}
                  setReadme={setReadme}
                />*/}
              </Flex>
            </TabPanel>
            <TabPanel p="0" flex="1" minH="0">
              <Flex
                mt="10"
                overflow="hidden"
                borderRadius="4"
                position="relative"
                border="1px solid #EDF2F7"
              >
                {readme ? (
                  <MarkdownRenderer content={readme} props={{ px: "16px" }} />
                ) : (
                  <LazyContent
                    element={
                      <DocumentEditor
                        doc={doc}
                        provider={provider}
                        readonly={readonly}
                        undoManager={undoManager}
                        initialData={description}
                        fieldName="description"
                      />
                    }
                  />
                )}
              </Flex>
            </TabPanel>
            <TabPanel p="0" flex="1" minH="0" display="flex">
              <Releases
                releases={releases?.data ?? []}
                isLoading={releasesLoading}
                onScrollEnd={onReleasesScrollEnd}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default PlatformComponentEditor;

const ComponentTags = ({ entity, onChange, readonly }) => {
  const message = useMessage();
  const [tags, setTags] = useState([]);

  useEffect(() => {
    setTags(entity?.tags || []);
  }, [entity]);

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

const ComponentAliases = ({ entity, onChange, readonly }) => {
  const message = useMessage();
  const [aliases, setAliases] = useState([]);

  useEffect(() => {
    setAliases(entity?.keyAliases || []);
  }, [entity]);

  const handleChange = async (newAliases) => {
    try {
      await onChange("keyAliases", "keyAliases", newAliases);
      setAliases(newAliases);
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <FormControl>
      <FormLabel>Aliases</FormLabel>
      <TagInput
        showIcon={false}
        autoFocus={false}
        readonly={readonly}
        objectType="aliases"
        onChange={handleChange}
        value={aliases}
      />
    </FormControl>
  );
};
