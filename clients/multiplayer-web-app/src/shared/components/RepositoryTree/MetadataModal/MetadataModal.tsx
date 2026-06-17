import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Flex,
  FormLabel,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import {
  EntityType,
  GitRefTagType,
  IProjectLink,
  ITag,
  ProjectLinkObjectType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import {
  ArrowLeftIcon,
  EntityCodeIcon,
  InfoCircleIcon,
  MetadataIcon,
  TrashIcon,
} from "shared/icons";
import Table from "shared/components/Table";
import TagInput from "shared/components/TagInput";
import EntityIcon from "shared/components/EntityIcon";
import { ITableSorting } from "shared/models/interfaces";
import { fetchAllData } from "shared/helpers/api.helpers";
import DebounceSearch from "shared/components/DebounceSearch";
import { EntityCategories, SortingDirection } from "shared/models/enums";

import {
  createProjectRepoLinksBulk,
  deleteProjectRepoLink,
  getProjectRepoLinks,
} from "shared/services/version.service";
import useMessage from "shared/hooks/useMessage";
import { useVersion } from "shared/providers/VersionContext";
import { useEntities } from "shared/providers/EntitiesContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import CheckAccess from "shared/components/CheckAccess";
import { usePermissions } from "shared/providers/PermissionsContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";

const MetadataModal = ({ item, tags, disclosure, onTagChange }) => {
  const message = useMessage();
  const { entities } = useEntities();
  const { openAlertDialog } = useAlertDialog();
  const { currentBranchId: branchId } = useVersion();
  const { isPublic } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState("");
  const [disableAdding, setDisableAdding] = useState(false);
  const [sorting, setSorting] = useState<ITableSorting>(null);
  const [linkedComponents, setLinkedComponents] = useState([]);
  const [addingComponent, setAddingComponent] = useState(false);
  const [selectedRows, setSelectedRows] = useState<{
    [index: number]: boolean;
  }>({});
  const { hasAccess } = usePermissions();
  const access = useMemo(() => {
    return {
      createTag: hasAccess(
        RoleProjectPermissionEntity.GIT_REF_TAG,
        RoleAccessAction.CREATE,
        RoleType.PROJECT
      ),
    };
  }, []);
  const linkedComponentColumns = [
    {
      field: "name",
      name: "Name",
      sortable: true,
      component: ({ _id, name }) => {
        return (
          <Flex w="100%" justifyContent="space-between" alignItems="center">
            <Flex gap="2">
              <EntityIcon name={EntityType.PLATFORM_COMPONENT} />
              {name}
            </Flex>
            <CheckAccess
              scope={RoleType.PROJECT}
              permission={RoleAccessAction.DELETE}
              entity={RoleProjectPermissionEntity.PROJECT_LINK}
            >
              <Icon
                as={TrashIcon}
                boxSize="16px"
                color="muted"
                cursor="pointer"
                onClick={() => {
                  handleDeleteLink(_id);
                }}
              />
            </CheckAccess>
          </Flex>
        );
      },
    },
  ];

  const notLinkedComponentsColumns = [
    {
      field: "entityName",
      name: "Name",
      sortable: true,
      component: ({ name, type }) => (
        <Flex w="100%" gap="2" alignItems="center" userSelect="none">
          <EntityIcon name={type} />
          {name}
        </Flex>
      ),
    },
  ];

  const getLinkedComponents = useCallback(async () => {
    const data = await fetchAllData<IProjectLink>(
      getProjectRepoLinks.bind(null, branchId),
      {
        gitRefRepositoryId: item.gitRepositoryId,
        gitRefPath: item.path,
        sourceObjectType: [item.objectType],
        targetObjectType: [ProjectLinkObjectType.Entity],
        targetEntityType: [EntityType.PLATFORM_COMPONENT], //, EntityType.API ?
      }
    );
    if (!data || !data?.length) {
      return;
    }
    setLinkedComponents(data);
  }, [branchId, item]);

  useEffect(() => {
    getLinkedComponents();
  }, []);

  const linkedComponentsList = useMemo(() => {
    return linkedComponents
      .map((c) => ({
        _id: c.projectLinkId,
        name: c.targetObject?.key,
        componentId: c.targetObject?.entityId,
      }))
      .filter((comp) => !!comp.name)
      .sort((a, b) => {
        return sorting?.direction === SortingDirection.DESC
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      });
  }, [linkedComponents, sorting]);

  const notLinkedComponentsList = useMemo(() => {
    return entities[EntityCategories.COMPONENT]
      .filter(
        (ent) =>
          !linkedComponentsList.find(
            (comp) => comp.componentId === ent.entityId
          )
      )
      .map(({ entityId, key, type }) => ({
        _id: entityId,
        name: key,
        type: type,
      }))
      .sort((a, b) => {
        return sorting?.direction === SortingDirection.DESC
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      })
      .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [entities, linkedComponentsList, sorting, searchQuery]);

  const handleCreateBulkLinks = async () => {
    setDisableAdding(true);

    const selectedEntities = Object.keys(selectedRows)
      .filter((k) => !!selectedRows[k])
      .map((index) => {
        return notLinkedComponentsList[index];
      });

    try {
      const res = await createProjectRepoLinksBulk(
        branchId,
        selectedEntities.map((entity) => ({
          sourceGitRef: {
            path: item.path,
            branch: item.gitDefaultBranch,
            repositoryId: item.gitRepositoryId,
            repositoryType: item.gitRepositoryType,
            repositoryName: item.gitRepositoryName,
            repositoryOwner: item.gitRepositoryOwner,
            ...(item.objectType === ProjectLinkObjectType.GitFile
              ? { contentType: item.sourceType }
              : {}),
          },
          sourceObjectType:
            item.objectType ||
            (item.type === GitRefTagType.GIT_REPOSITORY &&
              ProjectLinkObjectType.GitRepository),
          archived: false,
          targetObject: entity._id,
          targetObjectType: ProjectLinkObjectType.Entity,
        }))
      );

      if (res?.length) {
        message.success("Components have been linked.");
        setLinkedComponents((prev) => [
          ...prev,
          ...res.map((link, index) => ({
            projectLinkId: link.projectLinkId,
            targetObject: {
              key: selectedEntities[index].name,
              entityId: selectedEntities[index]._id,
            },
          })),
        ]);
      }
    } catch (e) {
      message.handleError(e);
    }

    setDisableAdding(false);
    setAddingComponent(false);
    setSelectedRows({});
  };

  const handleDeleteLink = async (linkId: string) => {
    const result = await openAlertDialog({
      title: "Are you sure you want to delete this link?",
    });
    if (!result) return;
    try {
      await deleteProjectRepoLink(branchId, linkId);
      setLinkedComponents((prev) =>
        prev.filter((link) => link.projectLinkId !== linkId)
      );
    } catch (error) {
      message.handleError(error);
    }
  };

  const onModalClose = () => {
    setSearchQuery("");
    setAddingComponent(false);
    disclosure.onClose();
  };

  const isBulkAddEnabled = useMemo(() => {
    return addingComponent && Object.values(selectedRows).some((v) => v);
  }, [addingComponent, selectedRows]);

  const onAllRowsSelect = (isSelected: boolean) => {
    const selection = isSelected
      ? notLinkedComponentsList.reduce((acc, _, index) => {
          acc[index] = isSelected;
          return acc;
        }, {})
      : {};

    setSelectedRows(selection);
  };

  const onModalAction = async () => {
    if (!isBulkAddEnabled) {
      disclosure.onClose();
      return;
    }
    if (!disableAdding) {
      await handleCreateBulkLinks();
    }
  };

  return (
    <Modal
      size="4xl"
      isCentered={true}
      isOpen={disclosure.isOpen}
      onClose={onModalClose}
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader px="4">
          <Flex gap="2" alignItems="center">
            <Icon
              as={MetadataIcon}
              __css={{
                "> path": { fill: "inverse" },
                "> rect": { fill: "brand.500", stroke: "brand.500" },
              }}
            />
            <Text fontWeight="500" fontSize="md">
              Metadata
            </Text>
          </Flex>
        </ModalHeader>
        <Divider />
        <ModalBody bg="bg.surface" p="0">
          <Flex justifyContent="space-between" alignItems="center">
            {addingComponent && (
              <IconButton
                size="sm"
                px="4"
                variant="base"
                aria-label="close"
                onClick={() => setAddingComponent(false)}
                icon={<Icon color="muted" as={ArrowLeftIcon} />}
              />
            )}
            <Flex gap="2" alignItems="center" my="4" px="4">
              <EntityCodeIcon />
              <Flex>{item.name}</Flex>
            </Flex>
          </Flex>
          {addingComponent ? (
            <Flex
              minH="345px"
              px="4"
              gap="4"
              direction="column"
              bg="bg.primary"
            >
              <Flex w="100%" alignItems="center" justifyContent="space-between">
                <Text>Choose a component to link: </Text>
                <DebounceSearch
                  onSearch={setSearchQuery}
                  inputGroupProps={{
                    maxWidth: "400px",
                  }}
                  inputProps={{
                    placeholder: "Search",
                  }}
                />
              </Flex>
              <Table
                useRowSelection
                tableWrapperHeight="350px"
                sorting={sorting}
                setSorting={setSorting}
                data={notLinkedComponentsList}
                columns={notLinkedComponentsColumns}
                selectRowOnClick={true}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                onAllRowsSelect={onAllRowsSelect}
              />
            </Flex>
          ) : (
            <Flex direction="column" gap="4" w="100%" p="4" bg="bg.primary">
              <Flex>
                <Icon as={InfoCircleIcon} mr="4px" color="brand.500"></Icon>
                <Box fontWeight="500" color="brand.500">
                  Information
                </Box>
              </Flex>

              <CheckAccess
                scope={RoleType.PROJECT}
                permission={RoleAccessAction.READ}
                entity={RoleProjectPermissionEntity.GIT_REF_TAG}
              >
                <Flex direction="column">
                  <FormLabel>Tags</FormLabel>
                  <TagInput
                    readonly={!access.createTag || isPublic}
                    value={tags.map((t: ITag) => t.value)}
                    onChange={onTagChange}
                  />
                </Flex>
              </CheckAccess>

              {/*Todo component click should navigate to component, when implemented, bring back this block*/}
              {/*<CheckAccess
                  scope={RoleType.PROJECT}
                  permission={RoleAccessAction.READ}
                  entity={RoleProjectPermissionEntity.PROJECT_LINK}
                >
                  <Flex color="muted">
                    <Icon
                      as={EntityApiIcon}
                      mr="8px"
                      __css={{ "> path": { fill: "brand.500" } }}
                    />
                    <Box fontWeight="500" color="brand.500">
                      Code for
                    </Box>
                  </Flex>
                  <Flex direction="column">
                    <Table
                      columns={linkedComponentColumns}
                      data={linkedComponentsList}
                      showNoData={false}
                      useRowSelection={false}
                      sorting={sorting}
                      setSorting={setSorting}
                      tableWrapperHeight="auto"
                    />
                    <CheckAccess
                      scope={RoleType.PROJECT}
                      permission={RoleAccessAction.CREATE}
                      entity={RoleProjectPermissionEntity.PROJECT_LINK}
                    >
                      <Flex
                        borderBottom="1px solid"
                        borderColor="border.primary"
                        cursor="pointer"
                        w="100%"
                        pl="3"
                        py="2"
                        m="0"
                        color="brand.600"
                        onClick={() => {
                          setAddingComponent(true);
                        }}
                      >
                        <Icon as={PlusCircleFilledIcon} mr="2"></Icon>
                        <Text fontWeight="500">Add Components</Text>
                      </Flex>
                    </CheckAccess>
                  </Flex>
                </CheckAccess>*/}
            </Flex>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onModalAction}>
            {isBulkAddEnabled ? "Add" : "Done"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MetadataModal;
