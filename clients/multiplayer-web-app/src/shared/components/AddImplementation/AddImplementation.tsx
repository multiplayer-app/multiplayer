import {
  Flex,
  Icon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Box,
  Button,
} from "@chakra-ui/react";
import { Github2Icon, ImportIcon } from "shared/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import Repositories from "pages/Workspace/Project/Layout/ContentLayout/Navbar/Explorer/Repositories";
import {
  createEntitiesBulk,
  createProjectRepoLinksBulk,
} from "shared/services/version.service";
import { EntityType, ProjectLinkObjectType } from "@multiplayer/types";
import useMessage from "shared/hooks/useMessage";
import { useVersion } from "shared/providers/VersionContext";
import { CollectionTarget } from "shared/models/enums";
import { getApiLabel } from "shared/utils";
import ApiLinkNameInputs from "shared/components/ApiLinkNameInputs";

interface AddImplementationProps {
  addedLinks?: any;
  entity: any;
  onClose?: () => void;
}

const AddImplementation = ({
  addedLinks,
  entity,
  onClose,
}: AddImplementationProps) => {
  const message = useMessage();
  const { currentBranchId } = useVersion();
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedItems, setSelectedItems] = useState(
    new Map<string, string[]>()
  ); // repo id -> selected paths array

  const { totalPaths, linkBody } = useMemo(() => {
    const files = Array.from(selectedItems).flatMap(([_, paths]) =>
      paths.map((path) => JSON.parse(path))
    );

    const linkBody = files.map((gitSource) => ({
      targetObject: entity.entityId,
      targetObjectType: ProjectLinkObjectType.Entity,
      sourceGitRef: {
        path: gitSource.path,
        contentType: gitSource.sourceType,
        branch: gitSource.gitDefaultBranch,
        repositoryId: gitSource.gitRepositoryId,
        repositoryType: gitSource.gitRepositoryType,
        repositoryName: gitSource.gitRepositoryName,
        repositoryOwner: gitSource.gitRepositoryOwner,
      },
      sourceObjectType: gitSource.objectType,
      archived: false,
    }));

    return {
      totalPaths: files?.length,
      linkBody,
    };
  }, [selectedItems]);

  useEffect(() => {
    if (link && !name) {
      const extractedName = getApiLabel(link, CollectionTarget.CODE);
      setName(extractedName);
    }
  }, [link]);

  const handleSelectionChange = (id: string, value: string[]) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, value);
      return newMap;
    });
  };

  const resetData = useCallback(() => {
    setTabIndex(0);
    setName("");
    setLink("");
    setSelectedItems(new Map<string, string[]>());
  }, []);

  const handleImplementationLinksCreation = async () => {
    try {
      if (tabIndex === 0) {
        // linking from entered URL
        const { added: entities } = await createEntitiesBulk(currentBranchId, [
          { key: name, type: EntityType.FILE, sourceUri: link },
        ]);

        await createProjectRepoLinksBulk(
          currentBranchId,
          entities.map(({ entity: { entityId } }) => ({
            sourceObjectType: ProjectLinkObjectType.Entity,
            targetObjectType: ProjectLinkObjectType.Entity,
            sourceObject: entityId,
            targetObject: entity.entityId,
          }))
        );
      } else {
        // linking from selected repos
        await handleCreateSourceLinks();
      }

      onClose();
      resetData();
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleCreateSourceLinks = async () => {
    try {
      await createProjectRepoLinksBulk(currentBranchId, linkBody);
      setSelectedItems(new Map<string, string[]>());
    } catch (error) {
      message.handleError(error);
      setSelectedItems(new Map<string, string[]>());
    }
  };

  return (
    <>
      <Tabs onChange={setTabIndex} index={tabIndex} p="4">
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
            Select from a repository
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <ApiLinkNameInputs onLinkChange={setLink} />
          </TabPanel>
          <TabPanel p={0}>
            <Box maxHeight="400px" overflowY="auto" overflowX="hidden" px={1}>
              <Repositories
                onChange={handleSelectionChange}
                addedLinks={addedLinks}
                showCheckbox={true}
                showRepoMetadata={false}
                isSearchable={true}
                filePreview={false}
              />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Flex p="4" justifyContent="flex-end" w="full">
        <Button
          isDisabled={tabIndex === 0 ? !link : totalPaths === 0}
          onClick={handleImplementationLinksCreation}
        >
          Add
        </Button>
      </Flex>
    </>
  );
};

export default AddImplementation;
