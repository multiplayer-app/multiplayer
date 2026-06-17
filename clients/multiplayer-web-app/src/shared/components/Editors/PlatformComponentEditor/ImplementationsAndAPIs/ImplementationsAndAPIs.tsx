import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Flex,
  Icon,
  IconButton,
  Link,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import {
  EntityType,
  GitContentType,
  IProjectLink,
  ProjectLinkObjectType,
} from "@multiplayer/types";

import { EntityApiIcon, PlusCircleFilledIcon, TrashIcon } from "shared/icons";
import Table from "shared/components/Table";
import Title from "shared/components/Title";
import EntityIcon from "shared/components/EntityIcon";
import ReposModal from "shared/components/ReposModal";
import { CollectionTarget } from "shared/models/enums";

import { useTabs } from "shared/providers/TabsContext";
import { ITableSorting } from "shared/models/interfaces";
import { fetchAllData } from "shared/helpers/api.helpers";
import {
  deleteProjectRepoLink,
  getProjectRepoLinks,
} from "shared/services/version.service";
import useMessage from "shared/hooks/useMessage";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { sortByName } from "shared/utils";
import { useRepositoryReadme } from "shared/hooks/useRepositoryReadme";

interface ImplementationsAndAPIsProps {
  name: string;
  branchId: string;
  entityId: string;
  readonly?: boolean;
  setReadme: (readme: string) => void;
}

const ImplementationsAndAPIs = ({
  name,
  branchId,
  entityId,
  readonly,
  setReadme,
}: ImplementationsAndAPIsProps) => {
  const modalDisclosure = useDisclosure();
  const apisRef = useRef<ImplementationRef>();
  const implementationsRef = useRef<ImplementationRef>();
  const [reposModalTarget, setReposModalTarget] = useState("");
  const [addedImplementations, setAddedImplementations] = useState([]);
  const [addedAPIs, setAddedAPIs] = useState([]);

  const handleOpen = (type: CollectionTarget) => {
    setReposModalTarget(type);
    modalDisclosure.onOpen();
  };

  const addedLinks = useMemo(() => {
    switch (reposModalTarget) {
      case CollectionTarget.API:
        return addedAPIs;
      case CollectionTarget.CODE:
        return addedImplementations;
    }
  }, [addedImplementations, addedAPIs, reposModalTarget]);

  const handleClose = (type: CollectionTarget) => {
    switch (type) {
      case CollectionTarget.API:
        apisRef.current.getData();
        break;
      case CollectionTarget.CODE:
        implementationsRef.current.getData();
        break;
      default:
        break;
    }
    modalDisclosure.onClose();
  };

  return (
    <>
      <Stack w="100%" mt="10" gap="10">
        <Implementations
          ref={implementationsRef}
          onOpen={handleOpen}
          setAddedLinks={setAddedImplementations}
          entityId={entityId}
          branchId={branchId}
          readonly={readonly}
          setReadme={setReadme}
        />
        <APIs
          ref={apisRef}
          onOpen={handleOpen}
          setAddedLinks={setAddedAPIs}
          entityId={entityId}
          branchId={branchId}
          readonly={readonly}
        />
      </Stack>
      <ReposModal
        target={reposModalTarget}
        isOpen={modalDisclosure.isOpen}
        onClose={handleClose}
        addedLinks={addedLinks}
        entity={{
          key: name,
          entityId: entityId,
          type: EntityType.PLATFORM_COMPONENT,
        }}
      ></ReposModal>
    </>
  );
};

const Implementations = forwardRef<ImplementationRef, ImplementationProps>(
  ({ entityId, branchId, readonly, onOpen, setAddedLinks, setReadme }, ref) => {
    const message = useMessage();
    const { onFileOpen } = useTabs();
    const { openAlertDialog } = useAlertDialog();
    const [implementations, setImplementations] = useState([]);
    const [sorting, setSorting] = useState<ITableSorting | null>(null);
    const { readme } = useRepositoryReadme(
      implementations?.length && implementations[0]
    );

    const getData = useCallback(async () => {
      const data = await fetchAllData<IProjectLink>(
        getProjectRepoLinks.bind(null, branchId),
        {
          sourceObjectType: [
            ProjectLinkObjectType.GitRepository,
            ProjectLinkObjectType.GitFile,
            ProjectLinkObjectType.External,
            ProjectLinkObjectType.Entity,
          ],
          sourceObjectEntityTypesToExclude: [
            EntityType.PLATFORM,
            EntityType.API,
          ],
          targetObjectType: [ProjectLinkObjectType.Entity],
          targetObjectId: entityId,
        }
      );
      if (!data || !data?.length) {
        return;
      }
      setImplementations(data);
      if (setAddedLinks) {
        setAddedLinks(data);
      }
    }, [branchId, entityId]);

    useEffect(() => {
      if (readme) {
        setReadme(readme);
      }
    }, [readme]);

    useImperativeHandle(ref, () => ({
      getData,
    }));

    useEffect(() => {
      if (entityId) {
        getData();
      }
    }, [entityId, branchId, getData]);

    const implementationsTableData = useMemo(() => {
      let data = implementations.map((link: any) => {
        const {
          sourceGitRepository,
          sourceGitRef,
          sourceObjectType,
          sourceUri,
          projectLinkId,
          sourceObject,
        } = link;
        return {
          name: sourceGitRepository?.gitRepository
            ? `${sourceGitRepository.gitRepository.owner}/${
                sourceGitRepository.gitRepository.name
              }${sourceGitRef?.path ? "/" + sourceGitRef?.path : ""}`
            : sourceObject?.key || sourceUri || "",
          iconType: sourceGitRef?.repositoryType,
          type: sourceObjectType,
          id: projectLinkId,
          url: sourceObject?.sourceUri,
        };
      });

      if (sorting) {
        sortByName(data, sorting.direction);
      }

      return data;
    }, [sorting, implementations]);

    const handleRowClick = (row) => {
      const link = implementations.find(
        (link) => row.id === link.projectLinkId
      );
      if (
        !link ||
        !link.sourceGitRef ||
        link.sourceGitRef.contentType === GitContentType.DIRECTORY ||
        link.sourceObjectType === ProjectLinkObjectType.GitRepository
      ) {
        return;
      }

      const pathChunks = link.sourceGitRef.path.split("/");
      const name = pathChunks[pathChunks.length - 1];

      const file = {
        name,
        path: link.sourceGitRef.path,
        branch: link.sourceGitRef.branch,
        repoId: link.sourceGitRepository._id,
        type: link.sourceGitRef.repositoryType,
        repositoryOwner: link.sourceGitRef.repositoryOwner,
        repositoryName: link.sourceGitRef.repositoryName,
      };

      onFileOpen(file);
    };

    const handleDeleteLink = async (linkId) => {
      const result = await openAlertDialog({
        title: "Are you sure you want to delete this link?",
      });
      if (!result) return;
      try {
        await deleteProjectRepoLink(branchId, linkId);
        setImplementations((prev) =>
          prev.filter((link) => link.projectLinkId !== linkId)
        );
      } catch (error) {
        message.handleError(error);
      }
    };

    return (
      <Box flex="1" minW="400px">
        <Title icon={EntityApiIcon}>Code</Title>
        <Stack gap={2}>
          {implementationsTableData.map((data, index) => (
            <Flex
              key={index}
              alignItems="center"
              justifyContent="space-between"
            >
              {data.url ? (
                <Link
                  color="brand.500"
                  fontWeight={500}
                  target="_blank"
                  rel="noreferrer"
                  wordBreak="break-all"
                  href={data.url}
                  _hover={{ textDecoration: "none" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(data);
                  }}
                >
                  {data.url}
                </Link>
              ) : (
                <Box
                  fontWeight={500}
                  cursor="pointer"
                  onClick={() => {
                    handleRowClick(data);
                  }}
                >
                  <ImplementationRowItem {...data} />
                </Box>
              )}
              {!readonly && (
                <IconButton
                  size="sm"
                  variant="base"
                  color="muted"
                  aria-label="trash"
                  icon={<Icon as={TrashIcon} boxSize="16px" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLink(data.id);
                  }}
                />
              )}
            </Flex>
          ))}
        </Stack>

        {!readonly && (
          <Flex
            borderBottom="1px solid"
            borderColor="border.primary"
            cursor="pointer"
            w="100%"
            pl="3"
            py="2"
            m="0"
            onClick={() => {
              onOpen(CollectionTarget.CODE);
            }}
          >
            <Icon as={PlusCircleFilledIcon} mr="2"></Icon>
            <Text color="muted" fontWeight="500">
              Add Code
            </Text>
          </Flex>
        )}
      </Box>
    );
  }
);

const APIs = forwardRef<ImplementationRef, ImplementationProps>(
  ({ entityId, branchId, readonly, onOpen, setAddedLinks }, ref) => {
    const message = useMessage();
    const { onEntityOpen } = useTabs();
    const { openAlertDialog } = useAlertDialog();
    const [linkedApis, setLinkedApis] = useState([]);
    const [sorting, setSorting] = useState<ITableSorting | null>(null);
    const getData = useCallback(async () => {
      const apiLinks = await getProjectRepoLinks(branchId, {
        // TODO: wrap in try catch
        sourceObjectType: [ProjectLinkObjectType.Entity],
        targetObjectType: [ProjectLinkObjectType.Entity],
        sourceEntityType: [EntityType.API, EntityType.FILE],
        targetObjectId: entityId,
      });

      if (!apiLinks?.data || !apiLinks?.data?.length) {
        return;
      }

      setLinkedApis(apiLinks.data);
      if (setAddedLinks) {
        setAddedLinks(apiLinks.data);
      }
    }, [branchId, entityId]);

    useImperativeHandle(ref, () => ({
      getData,
    }));

    useEffect(() => {
      if (entityId) {
        getData();
      }
    }, [entityId, branchId, getData]);

    const apisTableData = useMemo(() => {
      const data = linkedApis.map((link) => {
        const { projectLinkId, sourceObjectType, sourceObject } = link;

        return {
          id: projectLinkId,
          iconType: EntityType.API,
          type: sourceObjectType,
          name: sourceObject?.gitRef
            ? `${sourceObject.gitRef.repositoryOwner}/${
                sourceObject.gitRef.repositoryName
              }${
                sourceObject.gitRef.path ? "/" + sourceObject.gitRef.path : ""
              }`
            : sourceObject.key || "",
          url: sourceObject?.sourceUri,
        };
      });

      if (sorting) {
        sortByName(data, sorting.direction);
      }

      return data;
    }, [sorting, linkedApis]);

    const handleRowClick = (row) => {
      const link = linkedApis.find((link) => row.id === link.projectLinkId);
      if (
        link &&
        link.sourceObject &&
        link.sourceObjectType === ProjectLinkObjectType.Entity
      ) {
        onEntityOpen(link.sourceObject);
      }
    };

    const handleDeleteLink = async (linkId) => {
      const result = await openAlertDialog({
        title: "Are you sure you want to delete this link?",
      });
      if (!result) return;
      try {
        await deleteProjectRepoLink(branchId, linkId);
        setLinkedApis((prev) =>
          prev.filter((link) => link.projectLinkId !== linkId)
        );
      } catch (error) {
        message.handleError(error);
      }
    };

    return (
      <Box flex="1" minW="400px">
        <Title icon={EntityApiIcon}>APIs</Title>
        <Table
          columns={[
            {
              name: "URL",
              field: "link",
              component: (props) =>
                props.url ? (
                  <Link
                    color="brand.500"
                    target="_blank"
                    rel="noreferrer"
                    wordBreak="break-all"
                    href={props.url}
                    _hover={{ textDecoration: "none" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {props.url}
                  </Link>
                ) : (
                  <ImplementationRowItem {...props} />
                ),
            },
            {
              name: "",
              field: "",
              width: "40px",
              component: ({ id }) =>
                !readonly && (
                  <IconButton
                    size="sm"
                    variant="base"
                    color="muted"
                    aria-label="trash"
                    icon={<Icon as={TrashIcon} boxSize="16px" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLink(id);
                    }}
                  />
                ),
            },
          ]}
          sorting={sorting}
          showNoData={false}
          data={apisTableData}
          setSorting={setSorting}
          onRowClick={handleRowClick}
          tableWrapperHeight={"auto"}
        />
        {!readonly && (
          <Flex
            pl="3"
            py="2"
            w="full"
            cursor="pointer"
            borderBottom="1px solid"
            borderColor="border.primary"
            onClick={() => {
              onOpen(CollectionTarget.API);
            }}
          >
            <Icon as={PlusCircleFilledIcon} mr="2"></Icon>
            <Text color="muted" fontWeight="500">
              Add API
            </Text>
          </Flex>
        )}
      </Box>
    );
  }
);

const ImplementationRowItem = ({ name, iconType, id }) => {
  return (
    <Flex
      mr="-2"
      flex="1"
      key={id}
      alignItems="center"
      justifyContent="space-between"
    >
      <Flex gap="2">
        <EntityIcon name={iconType} />
        <Tooltip maxW="400px" label={name} openDelay={800}>
          <Text
            flex="1"
            maxW="330px"
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
          >
            {name || "Inaccessible Repository"}
          </Text>
        </Tooltip>
      </Flex>
    </Flex>
  );
};

interface ImplementationProps {
  entityId: string;
  branchId: string;
  readonly?: boolean;
  onOpen: (type: CollectionTarget) => void;
  setAddedLinks: (links: IProjectLink[]) => void;
  setReadme?: (readme: string) => void;
}

interface ImplementationRef {
  getData: () => void;
}
export default ImplementationsAndAPIs;
