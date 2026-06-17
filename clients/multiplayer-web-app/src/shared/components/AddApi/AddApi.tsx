import {
  Box,
  Text,
  Tabs,
  TabList,
  Tab,
  Icon,
  TabPanels,
  TabPanel,
  Input,
  Button,
  Flex,
  Spinner,
  FormLabel,
  FormControl,
  Badge,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Github2Icon, ImportIcon } from "shared/icons";
import Repositories from "pages/Workspace/Project/Layout/ContentLayout/Navbar/Explorer/Repositories";
import useSlugifiedName from "shared/hooks/useSlugifiedName";
import { EntityCategories, GitObjectType } from "shared/models/enums";
import {
  createEntitiesBulk,
  createProjectRepoLinksBulk,
} from "shared/services/version.service";
import { EntityType, ProjectLinkObjectType } from "@multiplayer/types";
import useMessage from "shared/hooks/useMessage";
import { useVersion } from "shared/providers/VersionContext";
import { CollectionTarget } from "shared/models/enums";
import { getApiLabel } from "shared/utils";
import { useEntities } from "shared/providers/EntitiesContext";
import SelectDropdown from "shared/components/SelectDropdown";
import EntityMetaIcon from "shared/components/EntityMetaIcon";

interface AddApiProps {
  addedLinks?: any;
  entity?: any;
  onClose?: (entityId: string) => void;
  selectComponents?: boolean;
}

const ApiNameId = "api-name-field";

const AddApi = ({
  addedLinks = [],
  entity,
  onClose,
  selectComponents = false,
}: AddApiProps) => {
  const message = useMessage();
  const { currentBranchId } = useVersion();
  const { entities } = useEntities();
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [dataFetching, setDataFetching] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedItems, setSelectedItems] = useState(
    new Map<string, string[]>()
  );
  const { caretPosition } = useSlugifiedName(name, (val) => {
    setName(val);
  });

  const components = useMemo(
    () => entities && entities[EntityCategories.COMPONENT],
    [entities]
  );

  const entityObj = useMemo(() => {
    if (entity) {
      return entity;
    }
    if (selectedComponent) {
      return {
        entityId: selectedComponent,
        key: components.find((i) => i.entityId === selectedComponent).key,
        type: EntityType.PLATFORM_COMPONENT,
      };
    }

    return null;
  }, [selectedComponent, components, entity]);

  const handleSelectionChange = (id: string, value: string[]) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, value);
      return newMap;
    });
  };

  const { filesToLink, totalPaths, linkBody } = useMemo(() => {
    const files = Array.from(selectedItems).flatMap(([_, paths]) =>
      paths.map((path) => JSON.parse(path))
    );

    const linkBody = files.map((gitSource) => ({
      key: gitSource.name,
      type: EntityType.API,
      gitRef: {
        path: gitSource.path,
        contentType: gitSource.sourceType,
        branch: gitSource.gitDefaultBranch,
        repositoryId: gitSource.gitRepositoryId,
        repositoryType: gitSource.gitRepositoryType,
        repositoryName: gitSource.gitRepositoryName,
        repositoryOwner: gitSource.gitRepositoryOwner,
      },
    }));

    return {
      filesToLink: files,
      totalPaths: files?.length,
      linkBody,
    };
  }, [selectedItems]);

  const resetData = useCallback(() => {
    setTabIndex(0);
    setName("");
    setLink("");
    setSelectedItems(new Map<string, string[]>());
  }, []);

  const handleAPILinksCreation = async () => {
    try {
      if (tabIndex === 0) {
        // linking from entered URL

        const { added: entities } = await createEntitiesBulk(currentBranchId, [
          { key: name, type: EntityType.API, sourceUri: link },
        ]);

        if (entityObj) {
          // link created entities with current entity
          await linkEntities(entities);
        }

        if (onClose) {
          const entityId = entities.length && entities[0]?.entity?.entityId;
          entityId && onClose(entityId);
        }
        return;
      }

      if (tabIndex === 1) {
        // linking from selected repos
        await handleCreateApiLinks();
        return;
      }
    } catch (error) {
      message.handleError(error);
      setSelectedItems(new Map<string, string[]>());
    }
    resetData();
  };

  const linkEntities = async (entities) => {
    await createProjectRepoLinksBulk(
      currentBranchId,
      entities.map(({ entity: { entityId } }) => ({
        sourceObjectType: ProjectLinkObjectType.Entity,
        targetObjectType: ProjectLinkObjectType.Entity,
        sourceObject: entityId,
        targetObject: entityObj.entityId,
      }))
    );
  };

  useEffect(() => {
    if (link && !name) {
      setDataFetching(true);
      const extractedName = getApiLabel(link, CollectionTarget.API);
      setName(extractedName);
      setTimeout(() => {
        setDataFetching(false);
      }, 300);
    }
  }, [link]);

  useEffect(() => {
    if (caretPosition) {
      const input = document.getElementById(ApiNameId) as HTMLInputElement;

      if (input) {
        input.setSelectionRange(caretPosition, caretPosition);
      }
    }
  }, [caretPosition]);

  const handleCreateApiLinks = async () => {
    try {
      // Create entity
      const { added: entities } = await createEntitiesBulk(
        currentBranchId,
        linkBody
      );

      if (entityObj) {
        // link created entities with current entity
        await linkEntities(entities);
      }

      // Create links between created entities and git source objects
      const gitSourceLinks = entities.reduce(
        (acc, { entity: { entityId, gitRef } }) => {
          if (!gitRef) return acc;

          const gitSource = filesToLink.find(
            ({ path, gitRepositoryId }) =>
              gitRepositoryId === gitRef.repositoryId && path === gitRef.path
          );

          if (!gitSource) return acc;

          return [
            ...acc,
            {
              targetObject: entityId,
              targetObjectType: ProjectLinkObjectType.Entity,
              sourceObjectType:
                gitSource.objectType || ProjectLinkObjectType.GitFile,
              sourceGitRef: {
                path: gitSource.path,
                branch: gitSource.gitDefaultBranch,
                contentType: gitSource.sourceType,
                repositoryId: gitSource.gitRepositoryId,
                repositoryType: gitSource.gitRepositoryType,
                repositoryName: gitSource.gitRepositoryName,
                repositoryOwner: gitSource.gitRepositoryOwner,
              },
              archived: false,
            },
          ];
        },
        []
      );

      if (gitSourceLinks.length) {
        await createProjectRepoLinksBulk(currentBranchId, gitSourceLinks);
      }

      setSelectedItems(new Map<string, string[]>());
      if (onClose) {
        const firstEntityId = entities?.length && entities[0]?.entity?.entityId;
        firstEntityId && onClose(firstEntityId);
      }
    } catch (error) {
      message.handleError(error);
      setSelectedItems(new Map<string, string[]>());
    }
  };

  const isSubmitDisabled = useMemo(() => {
    if (tabIndex === 0) return !link;
    if (tabIndex === 1) return totalPaths === 0;
  }, [tabIndex, link, totalPaths]);

  return (
    <>
      <Box pb="4" borderBottom="1px solid" borderColor="border.secondary">
        <Text fontWeight="400" color="muted">
          You can add any OpenAPI spec from a public URL or select an <br />
          API file from one of your connected repositories.
        </Text>
      </Box>
      <Tabs onChange={setTabIndex} index={tabIndex} py="4">
        <TabList bg="rgba(246, 246, 246, 1)" borderRadius="14px" mb={4}>
          <Tab
            flex="1"
            gap={2}
            m="2px"
            border="none"
            margin="0 1px"
            _selected={{
              bg: "bg.primary",
              color: "subtle",
              border: "1px solid rgba(226, 232, 240, 1)",
              boxShadow:
                "0px 3px 3px -1.5px rgba(0, 0, 0, 0.06), 0px 1px 1px -0.5px rgba(0, 0, 0, 0.06)",
            }}
            _focusVisible={{ boxShadow: "unset", border: "none" }}
            borderRadius="12px"
            py="10px"
          >
            <Icon as={ImportIcon} boxSize={5} />
            Add from a URL
          </Tab>
          <Tab
            flex="1"
            gap={2}
            m="2px"
            border="none"
            margin="0 1px"
            _selected={{
              bg: "bg.primary",
              color: "subtle",
              border: "1px solid rgba(226, 232, 240, 1)",
              boxShadow:
                "0px 3px 3px -1.5px rgba(0, 0, 0, 0.06), 0px 1px 1px -0.5px rgba(0, 0, 0, 0.06)",
            }}
            _focusVisible={{ boxShadow: "unset", border: "none" }}
            borderRadius="12px"
            py="10px"
          >
            <Icon as={Github2Icon} boxSize={5} />
            Add from repository
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <FormControl>
              <FormLabel color="subtle">URL</FormLabel>
              <Input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                borderRadius="12px"
              />
            </FormControl>
          </TabPanel>
          <TabPanel p={0}>
            <Box maxHeight="350px" overflowY="auto" overflowX="hidden" px={1}>
              <Repositories
                onChange={handleSelectionChange}
                addedLinks={addedLinks}
                showCheckbox={false}
                enabledObjectType={new Set([GitObjectType.FILE])}
                showRepoMetadata={false}
                isSearchable={true}
                isDarkTheme={false}
                filePreview={false}
              />
            </Box>
            {selectComponents && totalPaths > 0 && (
              <Box mt={4} w="100%">
                <AddComponent
                  value={selectedComponent}
                  onChange={setSelectedComponent}
                  components={components}
                />
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Flex py="4" justifyContent="flex-end" w="full">
        <Button isDisabled={isSubmitDisabled} onClick={handleAPILinksCreation}>
          {dataFetching && <Spinner color="inverse" mr="10px" boxSize={4} />}
          {dataFetching ? "Fetching data..." : "Add the API"}
        </Button>
      </Flex>
    </>
  );
};

const AddComponent = ({ value, onChange, components }) => {
  return (
    <>
      <Flex justifyContent="space-between" mb="1">
        <Text color="subtle">Link a component</Text>
        <Badge
          color="body"
          fontSize="12px"
          border="1px solid"
          borderColor="#0000000F"
          borderRadius="10px"
          textTransform="unset"
          px="10px"
        >
          Optional
        </Badge>
      </Flex>
      <SelectDropdown
        value={value}
        searchable={true}
        options={components?.map((i) => ({
          value: i.entityId,
          label: i.key,
          icon: (
            <EntityMetaIcon
              boxSize={5}
              metadata={i.metadata}
              type={EntityType.PLATFORM_COMPONENT}
            />
          ),
        }))}
        onChange={(opt) => onChange(opt.value)}
        leftChild={
          value ? (
            <EntityMetaIcon
              boxSize={5}
              metadata={components?.find((i) => i.entityId === value)?.metadata}
              type={EntityType.PLATFORM_COMPONENT}
            />
          ) : null
        }
        buttonProps={{
          width: "100%",
          borderRadius: "12px",
        }}
      />
    </>
  );
};

export default AddApi;
