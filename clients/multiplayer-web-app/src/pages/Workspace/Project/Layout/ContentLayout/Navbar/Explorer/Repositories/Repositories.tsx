import {
  Flex,
  Icon,
  Text,
  Box,
  Button,
  Image,
  CheckboxGroup,
  useDisclosure,
  MenuButton,
  MenuList,
  MenuItem,
  Menu,
  Portal,
  IconButton,
  Stack,
  Checkbox,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  GitRefTagType,
  IGitRepository,
  IProjectLink,
  ProjectLinkObjectType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";

import {
  BranchIcon,
  ChevronDownIcon,
  DotsVerticalIcon,
  ReloadIcon,
} from "shared/icons";
import { decodeFilePath } from "shared/utils";
import useMessage from "shared/hooks/useMessage";
import { IListRes } from "shared/models/interfaces";
import { GitObjectType } from "shared/models/enums";
import EntityIcon from "shared/components/EntityIcon";
import EmptyScreen from "shared/components/EmptyScreen";
import PageLoading from "shared/components/PageLoading";
import FlatTree from "shared/components/RepositoryTree/FlatTree";
import InfiniteScrollBox from "shared/components/InfiniteScrollBox";
import {
  deleteProjectGitRepository,
  getGitRepository,
  getGitRepositoryBranches,
  getProjectGitRepositories,
} from "shared/services/git.service";

import {
  ProjectLinksProvider,
  useEntitiesLinks,
} from "shared/providers/ProjectLinksContext";
import {
  ProjectTagsProvider,
  useEntitiesTags,
} from "shared/providers/ProjectTagsContext";
import { useTabs } from "shared/providers/TabsContext";
import { useVersion } from "shared/providers/VersionContext";
import DebounceSearch from "shared/components/DebounceSearch";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import RepoMetadata from "shared/components/RepositoryTree/RepoMetadata";
import PublicRepositoryModal from "shared/components/PublicRepositoryModal";
import EmptyRepositories from "assets/images/emptyStates/repositories-empty-list.png";
import SelectDropdown from "shared/components/SelectDropdown";
import CheckAccess from "shared/components/CheckAccess";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { workspaceSettingsHref } from "shared/navigation/workspaceSettingsPath";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

type GitBranch = {
  _id: string;
  id: string;
  name: string;
  lastCommitSha: string;
};

const Repositories = ({
  onChange,
  enabledObjectType,
  isSearchable = true,
  showRepoMetadata = true,
  addedLinks,
  showCheckbox = false,
  isDarkTheme = true,
  filePreview = true,
}: {
  enabledObjectType?: Set<GitObjectType>;
  onChange?: (id: string, value: string[]) => void;
  isSearchable?: boolean;
  showRepoMetadata?: boolean;
  addedLinks?: (IProjectLink & { sourceGitRepository: any })[];
  showCheckbox?: boolean;
  isDarkTheme?: boolean;
  filePreview?: boolean;
}) => {
  const message = useMessage();
  const navigate = useNavigate();
  const { workspaceId, projectId } = useParams();
  const { projects, isPublic } = useWorkspace();
  const { isOpen, onOpen: onPublicRepoModalOpen, onClose } = useDisclosure();
  const { withSandboxCheck } = useProjectSandbox();
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    skip: 0,
    limit: 100,
    gitRepositoryName: null,
  });

  const [repos, setRepos] = useState<IListRes<IGitRepository>>({
    data: [],
    cursor: { skip: 0, limit: 0, total: 0 },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getProjectGitRepositories(projectId, params);
        const newRepositories = [...res.data];

        await Promise.all(
          newRepositories.map(async (repo) => {
            try {
              const branchesRes = await getGitRepositoryBranches(
                projectId,
                repo._id
              );
              repo.branches = branchesRes?.data;
            } catch (e) {
              repo.branches = [];
              message.handleError(e);
            }
            return repo;
          })
        );

        setRepos((prev) => ({
          cursor: res.cursor,
          data: params.skip
            ? [...prev.data, ...newRepositories]
            : [...newRepositories],
        }));

        setLoading(false);
      } catch (error) {
        message.handleError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, params, message]);

  const onPublicRepoDelete = (repoId: string) => {
    setRepos((prev) => ({
      cursor: {
        ...prev.cursor,
        total: prev.cursor.total - 1,
      },
      data: prev.data.filter((repo) => repo._id !== repoId),
    }));
  };

  const onPublicRepoUpdate = (newRepo: IGitRepository) => {
    if (!repos.data.find(({ _id }) => _id === newRepo._id)) {
      setRepos((prev) => ({
        cursor: {
          ...prev.cursor,
          total: prev.cursor.total + 1,
        },
        data: [...prev.data, newRepo],
      }));
    }

    onClose();
  };

  const onRefetchRepoData = async (
    projectId: string,
    repoGitId: string,
    repoId: string
  ) => {
    const refetchedData = await getGitRepository(projectId, repoGitId);

    if (refetchedData) {
      const branchesRes = await getGitRepositoryBranches(projectId, repoId);
      refetchedData.branches = branchesRes?.data;

      setRepos((prev) => ({
        ...prev,
        data: prev.data.map((repo) =>
          repo.gitRepository.id === repoGitId ? refetchedData : repo
        ),
      }));
    }
  };

  const navigateToRepoSettings = (): void => {
    if (workspaceId) {
      navigate(
        workspaceSettingsHref(
          workspaceId,
          "integrations",
          projects.data,
          isPublic
        )
      );
    }
  };

  const handleScrollEnd = () => {
    if (loading || params.skip + params.limit > repos.cursor.total) {
      return;
    }

    setParams((prevParams) => ({
      ...prevParams,
      skip: prevParams.skip + prevParams.limit,
    }));
  };

  const setQuery = (query: string) => {
    setParams((prevParams) => ({
      ...prevParams,
      skip: 0,
      gitRepositoryName: query || null,
    }));
  };

  const repoValue = (item: IGitRepository): string => {
    return JSON.stringify({
      repositoryId: item._id,
      name: item.gitRepository.name,
      gitRepositoryId: item.gitRepository.id,
      gitRepositoryType: item.gitRepository.type,
      gitRepositoryOwner: item.gitRepository.owner,
      gitRepositoryName: item.gitRepository.name,
      objectType: ProjectLinkObjectType.GitRepository,
      gitDefaultBranch: item.gitRepository.defaultBranch,
    });
  };

  const isRepoLinked = (item: IGitRepository): boolean => {
    return !!addedLinks?.find(
      (i) =>
        i.sourceObjectType === ProjectLinkObjectType.GitRepository &&
        i.sourceGitRef.repositoryId === item.gitRepository.id &&
        i.sourceGitRef.repositoryType === item.gitRepository.type &&
        i.sourceGitRepository._id === item._id
    );
  };

  return (
    <ProjectLinksProvider>
      <ProjectTagsProvider>
        {isSearchable && (
          <DebounceSearch onSearch={setQuery} inputGroupProps={{ mb: 0 }} />
        )}
        {repos.data.length ? (
          <Flex flexDir="column" flex="1" gap="2" minH="0">
            <InfiniteScrollBox
              pl="2"
              pr="2.5"
              mx="-3"
              flex="1"
              isLoading={loading}
              onScrollEnd={handleScrollEnd}
            >
              {repos.data.map((item) => {
                return (
                  <Flex key={item._id} alignItems="flex-start" gap={2}>
                    <CheckboxGroup
                      onChange={(e) =>
                        onChange && onChange(item._id, e as string[])
                      }
                    >
                      {showCheckbox && (
                        <Checkbox
                          mt={9}
                          display="flex"
                          value={repoValue(item)}
                          isDisabled={isRepoLinked(item)}
                        />
                      )}
                      <RepositoryItem
                        data={item}
                        hasCheckbox={!!onChange}
                        addedLinks={addedLinks}
                        isDarkTheme={isDarkTheme}
                        branches={item["branches"]}
                        showRepoMetadata={showRepoMetadata}
                        enabledObjectType={enabledObjectType}
                        onRefetchRepoData={onRefetchRepoData}
                        onPublicRepoDelete={onPublicRepoDelete}
                        onChange={(val) => onChange(item._id, val)}
                        filePreview={filePreview}
                      />
                    </CheckboxGroup>
                  </Flex>
                );
              })}
            </InfiniteScrollBox>
            {showRepoMetadata && (
              <Flex gap={4} flexWrap="wrap">
                <CheckAccess
                  entity={RoleWorkspacePermissionEntity.INTEGRATION}
                  permission={RoleAccessAction.CREATE}
                >
                  <Button
                    variant="light"
                    flex="1 1 auto"
                    onClick={navigateToRepoSettings}
                  >
                    Configure a Git integration
                  </Button>
                </CheckAccess>
                <CheckAccess
                  entity={RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL}
                  permission={RoleAccessAction.CREATE}
                  scope={RoleType.PROJECT}
                >
                  <Button
                    variant="light"
                    flex="1 1 auto"
                    onClick={withSandboxCheck(onPublicRepoModalOpen)}
                  >
                    Connect to a public repository
                  </Button>
                </CheckAccess>
              </Flex>
            )}
          </Flex>
        ) : loading ? (
          <PageLoading my="4" position="relative" />
        ) : (
          <Stack justifyContent="space-between" flex={1} alignItems="center">
            <EmptyScreen
              title="You don’t have any repositories connected yet!"
              icon={<Image w="180px" src={EmptyRepositories} />}
              description={
                "Securely connect with your GitHub, GitLab or Bitbucket repositories\n" +
                "to fast track getting started with Multiplayer!"
              }
            >
              <CheckAccess
                entity={RoleWorkspacePermissionEntity.INTEGRATION}
                permission={RoleAccessAction.CREATE}
              >
                <Button
                  as={Link}
                  to={workspaceSettingsHref(
                    workspaceId,
                    "integrations",
                    projects.data,
                    isPublic
                  )}
                >
                  Enable integration
                </Button>
              </CheckAccess>
            </EmptyScreen>
            <CheckAccess
              entity={RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL}
              permission={RoleAccessAction.CREATE}
              scope={RoleType.PROJECT}
            >
              <Button
                w={isDarkTheme ? "100%" : "auto"}
                variant="light"
                onClick={withSandboxCheck(onPublicRepoModalOpen)}
              >
                Connect to a public repository
              </Button>
            </CheckAccess>
          </Stack>
        )}

        <PublicRepositoryModal
          isOpen={isOpen}
          onClose={onClose}
          onUpdate={onPublicRepoUpdate}
        />
      </ProjectTagsProvider>
    </ProjectLinksProvider>
  );
};

const RepositoryItem = ({
  data,
  hasCheckbox,
  enabledObjectType,
  onChange,
  onPublicRepoDelete,
  addedLinks = [],
  showRepoMetadata,
  branches,
  onRefetchRepoData,
  isDarkTheme = true,
  filePreview = true,
}: {
  data: IGitRepository;
  hasCheckbox: boolean;
  enabledObjectType: Set<GitObjectType>;
  onChange?: (val: string[]) => void;
  onPublicRepoDelete: (repoId: string) => void;
  addedLinks?: IProjectLink[];
  showRepoMetadata: boolean;
  onRefetchRepoData: (
    projectId: string,
    repoGitId: string,
    repoId: string
  ) => void;
  branches: GitBranch[];
  isDarkTheme?: boolean;
  filePreview?: boolean;
}) => {
  const { onFileOpen } = useTabs();
  const { path } = useParams();
  const message = useMessage();

  const [collapsed, setCollapsed] = useState(true);
  const [refetchIndex, setRefetchIndex] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState<string>(
    data?.gitRepository?.defaultBranch
  );
  const [hovered, setHovered] = useState(false);
  const { getLinks } = useEntitiesLinks();
  const { isPublic } = useWorkspace();
  const { currentBranchId } = useVersion();
  const { openAlertDialog } = useAlertDialog();
  const { getFileTags } = useEntitiesTags();

  useEffect(() => {
    const [repository, branch] = decodeFilePath(path);
    if (repository === data._id && branch === selectedBranch) {
      setCollapsed(false);
    }
  }, []);

  const onFileClick = (file) => {
    if (!filePreview) {
      return;
    }
    onFileOpen({
      name: file.name,
      path: file.path,
      repoId: data._id,
      branch: selectedBranch,
      type: data.gitRepository.type,
      repositoryOwner: file.gitRepositoryOwner,
      repositoryName: file.gitRepositoryName,
    });
  };

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const repoData = useMemo(() => {
    return {
      repositoryId: data._id,
      name: data.gitRepository.name,
      type: GitRefTagType.GIT_REPOSITORY,
      sourceType: data.gitRepository.type,
      gitRepositoryId: data.gitRepository.id,
      gitRepositoryType: data.gitRepository.type,
      gitRepositoryOwner: data.gitRepository.owner,
      gitRepositoryName: data.gitRepository.name,
      gitDefaultBranch: data.gitRepository.defaultBranch,
    };
  }, [data]);

  const onSelect = (branch: string) => {
    setSelectedBranch(branch);
  };

  useEffect(() => {
    if (!collapsed) {
      getFileTags(data);
      getLinks(data);
    }
  }, [collapsed, currentBranchId]);

  const openConfirmationDialog = async () => {
    const result = await openAlertDialog({
      title: "Delete public repository",
    });

    if (result) {
      await handleDeletePublicRepo();
    }
  };

  const handleDeletePublicRepo = async () => {
    try {
      await deleteProjectGitRepository(data._id, data.project);
      onPublicRepoDelete(data._id);
    } catch (e) {
      message.handleError(e);
    }
  };

  return (
    <CheckboxGroup onChange={(e) => onChange && onChange(e as string[])}>
      <Box
        mt="4"
        minW="0"
        bg={isDarkTheme ? "bg.surface" : "bg.primary"}
        border={isDarkTheme ? "unset" : "1px solid rgba(243, 244, 246, 1)"}
        fontSize="sm"
        fontWeight="500"
        borderRadius="xl"
        color="muted"
        w="full"
      >
        <Flex
          px="4"
          h="14"
          gap="2"
          top="0"
          zIndex="2"
          bg="inherit"
          cursor="pointer"
          userSelect="none"
          position="sticky"
          alignItems="center"
          borderRadius="inherit"
          onClick={toggleCollapse}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <Icon
            cursor="pointer"
            color="muted"
            transform={collapsed ? "rotate(-90deg)" : "rotate(0)"}
            as={ChevronDownIcon}
          />
          <EntityIcon name={data.gitRepository.type} boxSize="4" />
          <Text
            minW="0"
            mr="auto"
            as="span"
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
          >
            {data.gitRepository.owner}/{data.gitRepository.name}
          </Text>

          {showRepoMetadata && (
            <RepoMetadata
              item={repoData}
              isShown={hovered}
              updateShownState={setHovered}
            />
          )}

          {!data.gitRepository.private && showRepoMetadata && !isPublic && (
            <Menu placement="bottom">
              <IconButton
                h="21px"
                variant="base"
                minWidth="16px"
                as={MenuButton}
                aria-label="actionMenu"
                icon={<Icon as={DotsVerticalIcon} color="muted" />}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
              <Portal>
                <MenuList zIndex="10">
                  <MenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirmationDialog();
                    }}
                  >
                    Remove public repository
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          )}
        </Flex>
        {!collapsed && !!branches?.length && showRepoMetadata && (
          <Flex
            pl="44px"
            pr={4}
            py="10px"
            zIndex={10}
            onClick={(e) => {
              e.stopPropagation();
              if (branches?.length === 1) {
                e.preventDefault();
              }
            }}
            justifyContent="space-between"
            alignItems="center"
            borderTop="1px solid"
            borderColor="border.primary"
          >
            <SelectDropdown
              value={selectedBranch}
              searchable={true}
              placeholder="Select branch"
              options={branches.map((i) => ({
                label: i.name,
                value: i._id,
              }))}
              onChange={(event) => onSelect(event.label)}
              listProps={{ zIndex: 10 }}
              buttonProps={{
                maxWidth: "max-content",
                background: "bg.primary",
                borderRadius: "12px",
                boxShadow:
                  "0px 3px 3px -1.5px #0000000F, 0px 1px 1px -0.5px #0000000F",
              }}
              leftChild={<Icon as={BranchIcon} mr="8px" height={4} />}
            />
            <Icon
              as={ReloadIcon}
              color="muted"
              cursor="pointer"
              style={{
                transition: "transform 0.3s linear",
                transform: `rotate(${-360 * refetchIndex}deg)`,
              }}
              onClick={() => {
                setRefetchIndex(refetchIndex + 1);
                onRefetchRepoData(
                  data.project,
                  data.gitRepository.id,
                  data._id
                );
              }}
            />
          </Flex>
        )}
        {!collapsed && (
          <FlatTree
            projectId={data.project}
            repositoryId={data._id}
            gitRepository={data.gitRepository}
            enabledObjectType={enabledObjectType}
            gitDefaultBranch={selectedBranch || "main"}
            hasCheckbox={hasCheckbox}
            onFileClick={onFileClick}
            refetchIndex={refetchIndex}
            showRepoMetadata={showRepoMetadata}
            addedLinks={addedLinks}
            isDarkTheme={isDarkTheme}
          />
        )}
      </Box>
    </CheckboxGroup>
  );
};

export default Repositories;
