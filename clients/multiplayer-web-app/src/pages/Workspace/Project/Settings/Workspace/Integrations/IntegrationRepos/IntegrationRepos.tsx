import {
  Tr,
  Th,
  Td,
  Menu,
  Icon,
  Table,
  Tbody,
  Thead,
  Button,
  Portal,
  MenuList,
  MenuButton,
  Text,
  Box,
  Flex,
  CheckboxGroup,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { EyeIcon, ChevronDownIcon } from "shared/icons";
import {
  IProject,
  IGitRepository,
  IntegrationTypeEnum,
} from "@multiplayer/types";
import useMessage from "shared/hooks/useMessage";
import * as GitService from "shared/services/git.service";
import { fetchAllData } from "shared/helpers/api.helpers";
import InfiniteScrollBox from "shared/components/InfiniteScrollBox";
import Pluralize from "shared/components/Pluralize";
import DebounceSearch from "shared/components/DebounceSearch";
import MenuItemCheckbox from "shared/components/MenuItemCheckbox";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";
import { IGitIntegrationConfig } from "shared/configs/git.configs";

type connectionState = Map<string, Array<string>>;

const IntegrationRepos = ({
  type,
  configs,
  projects,
  integration,
}: {
  projects: IProject[];
  integration: string;
  type: IntegrationTypeEnum;
  configs: IGitIntegrationConfig;
}) => {
  const message = useMessage();
  const { trackEvent } = useAnalytics();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLastPage, setIsLastPage] = useState(false);
  const [connections, setConnections] = useState<connectionState>(new Map());
  const [params, setParams] = useState({ page: 1, perPage: 50 });

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const res = await fetchAllData<IGitRepository>(
          GitService.getWorkspaceGitRepositories.bind(null)
        );
        const connectionMap: connectionState = new Map();
        res
          .filter((c) => projects.some((p) => p._id === c.project))
          .forEach((c) => {
            const projectIds = connectionMap.get(c.gitRepository._id) || [];
            projectIds.push(c.project);
            connectionMap.set(c.gitRepository._id, projectIds);
          });
        setConnections(connectionMap);
      } catch (error) {
        console.log(error);
      }
    };

    fetchEntities();
  }, [message, projects]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await GitService.getRepositories(integration, params);

        setIsLastPage(res.data.length < params.perPage);
        setRepos((prev) => [...prev, ...res.data]);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    fetchData();
  }, [params, integration, message]);

  const onScrollEnd = () => {
    if (loading || isLastPage) return;
    setParams((prevParams) => ({ ...prevParams, page: prevParams.page + 1 }));
  };

  const updateConnection = useCallback(
    async (gitRepositoryId: string, projects: string[]) => {
      let prevState;
      try {
        setConnections((prevConnections) => {
          prevState = prevConnections;
          const updatedConnections = new Map(prevConnections);
          updatedConnections.set(gitRepositoryId, projects);
          return updatedConnections;
        });
        await GitService.updateProjectConnections({
          projects,
          gitRepositoryId,
          archived: false,
          gitRepositoryType: type,
        });

        if (projects.length) {
          trackEvent(PostHogEvents.CONNECT_REPO_TO_PROJECT, {
            connectedProjects: projects,
            repositoryId: gitRepositoryId,
            gitRepositoryType: type,
            actionSource: "Settings -> Workspace -> Integrations",
          });
        }
      } catch (error) {
        message.handleError(error);
        setConnections(prevState);
      }
    },
    [message]
  );

  return (
    <InfiniteScrollBox
      w="full"
      minH="10"
      border="1px"
      overflow="auto"
      borderRadius="xl"
      isLoading={loading}
      borderColor="border.primary"
      onScrollEnd={onScrollEnd}
    >
      <Table size="sm">
        <Thead position="sticky" top="0" zIndex="1" h="10" bg="bg.primary">
          <Tr>
            <Th px="4">REPOSITORIES</Th>
            <Th px="4" isNumeric>
              VISIBILITY
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {repos.map((item) => (
            <RepositoryRow
              data={item}
              key={item._id}
              configs={configs}
              projects={projects}
              connection={connections.get(item._id)}
              onUpdate={updateConnection}
            />
          ))}
        </Tbody>
      </Table>
    </InfiniteScrollBox>
  );
};

const RepositoryRow = ({ data, configs, projects, connection, onUpdate }) => {
  const allCheckState = useMemo<number>(() => {
    if (!connection?.length) return 0;
    if (projects.every((project) => connection.includes(project._id))) return 2;
    return 1;
  }, [connection, projects]);

  return (
    <Tr key={data.id} _last={{ td: { borderBottom: 0 } }}>
      <Td px="4" wordBreak="break-word">
        <Flex alignItems="center">
          <Icon as={configs.icon} boxSize="6" mr="2" />
          <Box as="span">{data.fullName}</Box>
        </Flex>
      </Td>
      <Td px="2" isNumeric whiteSpace="nowrap">
        <Menu placement="bottom-end" isLazy>
          <MenuButton
            as={Button}
            minW="180px"
            variant="light"
            leftIcon={<EyeIcon />}
            rightIcon={<ChevronDownIcon />}
          >
            {!allCheckState ? (
              "0 projects"
            ) : allCheckState === 2 ? (
              "All projects"
            ) : (
              <Pluralize count={connection.length} singular="project" />
            )}
          </MenuButton>
          <Portal>
            <MenuList maxH="200px" overflow="auto">
              <ProjectsDropdownMenu
                projects={projects}
                connection={connection}
                gitRepositoryId={data._id}
                allCheckState={allCheckState}
                onUpdate={onUpdate}
              />
            </MenuList>
          </Portal>
        </Menu>

        {/* <IconButton
          ml="2"
          size="xs"
          aria-label="link"
          onClick={() => onTagClick(data)}
          icon={<Icon as={TagIcon} />}
        />
        <IconButton
          ml="4"
          size="xs"
          aria-label="link"
          icon={<Icon as={LinkIcon} />}
        /> */}

        {/* <Menu placement="bottom-end" isLazy>
          <MenuButton
            ml="2"
            pr="0"
            size="xs"
            as={IconButton}
            variant="base"
            aria-label="more"
            icon={<Icon color="muted" as={DotsVerticalIcon} />}
          ></MenuButton>
          <Portal>
            <MenuList overflow="auto">
              <MenuItem>Option 1</MenuItem>
              <MenuItem>Option 2</MenuItem>
            </MenuList>
          </Portal>
        </Menu> */}
      </Td>
    </Tr>
  );
};

const ProjectsDropdownMenu = ({
  onUpdate,
  projects,
  connection,
  allCheckState,
  gitRepositoryId,
}) => {
  const { openAlertDialog } = useAlertDialog();
  const [query, setQuery] = useState("");
  const list = useMemo<IProject[]>(() => {
    return projects.filter(
      (p: IProject) => p.name.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }, [query, projects]);

  const value = useMemo<string[]>(() => {
    return Array.from(connection || []);
  }, [connection]);

  const openConfirmationDialog = async (args: Array<string | number>) => {
    const result = await openAlertDialog({
      title:
        "Are you sure you want to remove this repository from the project?",
      description: "Please confirm to continue.",
      confirmBtnLabel: "Confirm",
    });

    if (result) {
      await onUpdate(gitRepositoryId, args);
    }
  };

  const onToggleAll = async (e) => {
    if (e.target.checked) {
      onUpdate(
        gitRepositoryId,
        projects.map((p) => p._id)
      );
    } else {
      await openConfirmationDialog([]);
    }
  };

  const onProjectToggle = async (selection: Array<string | number>) => {
    if (selection.length < value.length) {
      await openConfirmationDialog(selection);
    } else {
      onUpdate(gitRepositoryId, selection);
    }
  };

  if (!projects.length)
    return (
      <Text py="2" textAlign="center" color="muted">
        There are no projects yet.
      </Text>
    );

  return (
    <>
      <DebounceSearch
        onSearch={setQuery}
        inputGroupProps={{
          mb: 2,
          mt: -2,
          mx: -2,
          w: "auto",
          borderBottom: "1px",
          borderBottomColor: "border.primary",
        }}
        inputProps={{ border: 0, borderRadius: 0 }}
      />
      {!query && (
        <MenuItemCheckbox
          isIndeterminate={allCheckState === 1}
          isChecked={allCheckState === 2}
          onChange={onToggleAll}
        >
          All Projects
        </MenuItemCheckbox>
      )}
      <CheckboxGroup value={value} onChange={onProjectToggle}>
        {list.map((p: IProject) => (
          <MenuItemCheckbox key={p._id} value={p._id}>
            {p.name}
          </MenuItemCheckbox>
        ))}
      </CheckboxGroup>
    </>
  );
};

export default IntegrationRepos;
