import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Text,
  Button,
  Avatar,
  useDisclosure,
  ButtonProps,
  Flex,
  Input,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Divider,
  Portal,
} from "@chakra-ui/react";
import {
  IUserSession,
  IUserSessionWorkspace,
  IProject,
  RoleAccessAction,
  RoleAccountPermissionEntity,
  RoleType,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";

import { SortingArrowIcon } from "shared/icons";
import { useAuth } from "shared/providers/AuthContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import CreateWorkspaceModal from "shared/components/CreateWorkspaceModal";
import CheckAccess from "shared/components/CheckAccess";
import * as WorkspaceService from "shared/services/workspace.service";
import useMessage from "shared/hooks/useMessage";
import { PostHogEvents } from "shared/models/enums";
import ProjectModal from "shared/components/ProjectModal";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import {
  buildProjectBasePath,
  DEFAULT_PROJECT_BRANCH_ID,
  DEFAULT_PROJECT_SOURCE_TAB,
  resolveDefaultProjectPath,
} from "shared/navigation/defaultProjectPath";
import { navigateToCreatedWorkspaceProject } from "shared/navigation/navigateAfterWorkspaceCreation";
import TextEllipsis from "shared/components/TextEllipsis";
import Icon from "../Icon";
import { AccountSection } from "./AccountSection";
import {
  SwitcherMenuProvider,
  type SwitcherMenuContextValue,
} from "./menuContext";

function roleAllowsWorkspaceProjectCreate(
  role: {
    permissions?: { entity: string; access: RoleAccessAction[] }[];
  } | null
): boolean {
  if (!role?.permissions) {
    return false;
  }
  const projectPerm = role.permissions.find(
    (p) => p.entity === RoleWorkspacePermissionEntity.PROJECT
  );
  return !!projectPerm?.access?.includes(RoleAccessAction.CREATE);
}

export type WorkspaceSwitcherProps = ButtonProps & {
  expanded?: boolean;
};

const WorkspaceSwitcher = ({
  expanded = true,
  ...props
}: WorkspaceSwitcherProps) => {
  const navigate = useNavigate();
  const switcherDisclosure = useDisclosure();
  const createWorkspaceDisclosure = useDisclosure();
  const createProjectDisclosure = useDisclosure();
  const { cleanupWorkspace, getProjects } = useWorkspace();

  const message = useMessage();
  const { trackEvent } = useAnalytics();
  const { workspaceId, projectId } = useParams();
  const { workspaceRoles, hasAccess, permissions } = usePermissions();
  const { sessions, user, setSession, signOut, updateSessions } = useAuth();

  const [otherWorkspaceProjectCreate, setOtherWorkspaceProjectCreate] =
    useState<Record<string, boolean>>({});

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");

  const { workspace, project } = useMemo(() => {
    if (!workspaceId || !user) {
      return { workspace: null, project: null };
    }
    const workspace = user.workspaces?.find((w) => w._id === workspaceId);
    return {
      workspace: workspace,
      project: workspace?.projects?.find((p) => p._id === projectId) || null,
    };
  }, [user, workspaceId, projectId]);

  /** Scroll target for the current workspace/project row (no programmatic .focus — avoids stealing focus from search). */
  const activeMenuItemRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const scrollActiveRowIntoView = useCallback(() => {
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        activeMenuItemRef.current?.scrollIntoView({ block: "nearest" });
      });
    });
  }, []);

  const prefetchRemoteProjectCreateAccess = useCallback(async () => {
    const ids = new Set<string>();
    for (const s of sessions) {
      if (s._id !== user._id) continue;
      for (const w of s.workspaces) {
        if (w._id !== workspaceId) {
          ids.add(w._id);
        }
      }
    }
    if (ids.size === 0) {
      setOtherWorkspaceProjectCreate({});
      return;
    }
    const entries = await Promise.all(
      [...ids].map(async (id) => {
        try {
          const role = await WorkspaceService.getWorkspaceRole(id);
          return [id, roleAllowsWorkspaceProjectCreate(role)] as const;
        } catch {
          return [id, false] as const;
        }
      })
    );
    setOtherWorkspaceProjectCreate(Object.fromEntries(entries));
  }, [sessions, user._id, workspaceId]);

  const canAddProjectForWorkspace = useCallback(
    (session: IUserSession, item: IUserSessionWorkspace) => {
      if (session._id !== user._id) {
        return false;
      }
      if (item._id === workspaceId && permissions.fetching) {
        return false;
      }
      if (item._id === workspaceId) {
        return hasAccess(
          RoleWorkspacePermissionEntity.PROJECT,
          RoleAccessAction.CREATE
        );
      }
      return otherWorkspaceProjectCreate[item._id] === true;
    },
    [
      user._id,
      workspaceId,
      permissions.fetching,
      hasAccess,
      otherWorkspaceProjectCreate,
    ]
  );

  const createProjectWorkspaceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!createProjectDisclosure.isOpen) {
      createProjectWorkspaceIdRef.current = null;
    }
  }, [createProjectDisclosure.isOpen]);

  const switchToProjectBase = useCallback(
    (
      session: IUserSession,
      ws: IUserSessionWorkspace,
      project: IUserSessionWorkspace["projects"][number]
    ) => {
      if (user._id !== session._id) setSession(session);
      const stub = { _id: project._id, name: project.name } as IProject;
      const path = resolveDefaultProjectPath(
        session._id,
        ws._id,
        [stub],
        false,
        project._id,
        DEFAULT_PROJECT_BRANCH_ID
      );
      const fallback = `${buildProjectBasePath(
        ws._id,
        project._id,
        DEFAULT_PROJECT_BRANCH_ID,
        false
      )}/${DEFAULT_PROJECT_SOURCE_TAB}`;
      navigate(path || fallback);
    },
    [user._id, setSession, navigate]
  );

  const switchWorkspaceBase = useCallback(
    async (session: IUserSession, ws?: IUserSessionWorkspace) => {
      const targetWs = ws || session.workspaces[0];
      if (user._id !== session._id) setSession(session);

      if (targetWs) {
        try {
          const path = resolveDefaultProjectPath(
            session._id,
            targetWs._id,
            targetWs.projects || [],
            false
          );
          navigate(path || `/project/${targetWs._id}/projects`);
        } catch {
          navigate(`/project/${targetWs._id}/projects`);
        }
      } else {
        cleanupWorkspace();
        navigate("/dashboard/create-workspace");
      }
    },
    [user._id, setSession, navigate, cleanupWorkspace]
  );

  const openCreateProjectModalBase = useCallback(
    (session: IUserSession, item: IUserSessionWorkspace) => {
      if (user._id !== session._id) setSession(session);
      createProjectWorkspaceIdRef.current = item._id;
      createProjectDisclosure.onOpen();
    },
    [user._id, setSession, createProjectDisclosure.onOpen]
  );

  const closeSwitcher = useCallback(() => {
    activeMenuItemRef.current = null;
    setSearchTerm("");
    switcherDisclosure.onClose();
  }, [switcherDisclosure]);

  const switchToProject = useCallback(
    (
      session: IUserSession,
      ws: IUserSessionWorkspace,
      project: IUserSessionWorkspace["projects"][number]
    ) => {
      closeSwitcher();
      switchToProjectBase(session, ws, project);
    },
    [closeSwitcher, switchToProjectBase]
  );

  const switchWorkspace = useCallback(
    async (session: IUserSession, ws?: IUserSessionWorkspace) => {
      closeSwitcher();
      await switchWorkspaceBase(session, ws);
    },
    [closeSwitcher, switchWorkspaceBase]
  );

  const openCreateProjectModal = useCallback(
    (session: IUserSession, item: IUserSessionWorkspace) => {
      closeSwitcher();
      openCreateProjectModalBase(session, item);
    },
    [closeSwitcher, openCreateProjectModalBase]
  );

  const switcherMenu = useMemo<SwitcherMenuContextValue>(
    () => ({
      currentUserId: user._id,
      workspaceId,
      projectId,
      workspaceRoles,
      canAddProjectForWorkspace,
      activeMenuItemRef,
      switchWorkspace,
      switchToProject,
      openCreateProjectModal,
    }),
    [
      user._id,
      workspaceId,
      projectId,
      workspaceRoles,
      canAddProjectForWorkspace,
      switchWorkspace,
      switchToProject,
      openCreateProjectModal,
    ]
  );

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const isSearching = normalizedSearchTerm.length > 0;

  const filteredSessions = useMemo(() => {
    if (!isSearching) {
      return sessions;
    }

    return sessions
      .map((session) => {
        const emailMatches = (session.primaryEmail ?? "")
          .toLowerCase()
          .includes(normalizedSearchTerm);

        if (emailMatches) {
          return session;
        }

        const workspaces = (session.workspaces ?? [])
          .map((workspace) => {
            const workspaceMatches = workspace.name
              .toLowerCase()
              .includes(normalizedSearchTerm);
            const projects = workspace.projects ?? [];
            const filteredProjects = workspaceMatches
              ? projects
              : projects.filter((project) =>
                  project.name.toLowerCase().includes(normalizedSearchTerm)
                );

            if (!workspaceMatches && filteredProjects.length === 0) {
              return null;
            }

            return {
              ...workspace,
              projects: filteredProjects,
            };
          })
          .filter(
            (workspace): workspace is IUserSessionWorkspace => !!workspace
          );

        if (workspaces.length === 0) {
          return null;
        }

        return {
          ...session,
          workspaces,
        };
      })
      .filter((session): session is IUserSession => !!session);
  }, [sessions, isSearching, normalizedSearchTerm]);

  const handleCreateProjectSubmit = async (
    values: { name: string },
    iconFile,
    coverFile
  ) => {
    const wid = createProjectWorkspaceIdRef.current;
    if (!wid) return;
    try {
      const res = await WorkspaceService.createProject(wid, {
        name: values.name,
      });

      trackEvent(PostHogEvents.CREATE_PROJECT, {
        projectName: values.name,
        teamId: undefined,
        actionSource: "Workspace switcher",
      });

      const promises: Promise<unknown>[] = [];
      if (iconFile) {
        promises.push(
          WorkspaceService.updateProjectIcon(wid, res._id, iconFile)
        );
      }
      if (coverFile) {
        promises.push(
          WorkspaceService.updateProjectCover(wid, res._id, coverFile)
        );
      }
      await Promise.all(promises);
      const sessionsAfter = await updateSessions();
      if (wid === workspaceId) {
        await getProjects(wid);
      }
      createProjectDisclosure.onClose();

      const ownerSession = sessionsAfter?.find((s) =>
        s.workspaces.some((w) => w._id === wid)
      );
      if (ownerSession) {
        const wsEntry = ownerSession.workspaces.find((w) => w._id === wid)!;
        const projectEntry = wsEntry.projects?.find(
          (p) => p._id === res._id
        ) ?? { _id: res._id, name: values.name, role: "" };
        switchToProject(ownerSession, wsEntry, projectEntry);
      } else {
        navigate(`/project/${wid}/projects`);
      }
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleCreateWorkspaceModalClose = async (res) => {
    const createdWid = res?.workspace?._id;
    if (createdWid) {
      const sessionsAfter = (await updateSessions()) ?? sessions;
      await navigateToCreatedWorkspaceProject({
        createdWorkspaceId: createdWid,
        sessions: sessionsAfter,
        navigate,
        setSession,
        currentUserId: user._id,
      });
    }
    createWorkspaceDisclosure.onClose();
  };

  const toggleSessionExpanded = useCallback((sessionId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  const handleSignOut = useCallback(() => {
    void signOut();
  }, [signOut]);

  return (
    <>
      <Popover
        isOpen={switcherDisclosure.isOpen}
        onOpen={() => {
          switcherDisclosure.onOpen();
          void prefetchRemoteProjectCreateAccess();
          queueMicrotask(() => {
            requestAnimationFrame(() => {
              searchInputRef.current?.focus({ preventScroll: true });
              scrollActiveRowIntoView();
            });
          });
        }}
        onClose={closeSwitcher}
        placement="bottom-start"
        strategy="fixed"
        closeOnBlur
        closeOnEsc
        initialFocusRef={searchInputRef}
        autoFocus={false}
        gutter={8}
      >
        <PopoverTrigger>
          <Button
            px="0"
            h="auto"
            w="100%"
            variant="base"
            borderRadius="md"
            _hover={{ bg: "transparent" }}
            {...props}
          >
            <Flex align="center" gap="2.5" w="100%" minW="0">
              {project ? (
                <Avatar
                  size="sm"
                  boxSize="8"
                  borderRadius="base"
                  key={project.name}
                  name={project.name}
                  src={project.iconUrl}
                  flexShrink={0}
                />
              ) : workspace ? (
                <Avatar
                  size="sm"
                  boxSize="8"
                  borderRadius="base"
                  name={workspace.name}
                  src={workspace.iconUrl}
                  flexShrink={0}
                />
              ) : null}
              {expanded && (
                <>
                  <Flex
                    minW="0"
                    flex="1"
                    lineHeight="1.3"
                    direction="column"
                    align="flex-start"
                    textAlign="left"
                  >
                    <TextEllipsis fontWeight="medium" fontSize="sm" maxW="100%">
                      {project?.name || workspace?.name || "Public"}
                    </TextEllipsis>
                    {project?.name ? (
                      <TextEllipsis fontSize="xs" color="muted" maxW="100%">
                        {workspace?.name || "Public"}
                      </TextEllipsis>
                    ) : null}
                  </Flex>
                  <Icon
                    as={SortingArrowIcon}
                    flexShrink={0}
                    color="muted"
                    boxSize="4"
                  />
                </>
              )}
              {!expanded ? (
                <Icon
                  as={SortingArrowIcon}
                  flexShrink={0}
                  color="muted"
                  boxSize="4"
                />
              ) : null}
            </Flex>
          </Button>
        </PopoverTrigger>
        <Portal>
          <PopoverContent
            zIndex={1500}
            w="260px"
            minW="260px"
            maxW="260px"
            p={0}
            overflow="hidden"
            bg="bg.primary"
            borderWidth="1px"
            borderColor="border.secondary"
            shadow="md"
          >
            <PopoverBody p={0} bg="bg.primary">
              <Box p="2" pb="1">
                <Input
                  ref={searchInputRef}
                  size="sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search accounts, workspaces, or projects"
                  autoComplete="off"
                />
              </Box>
              <Flex
                p="2"
                gap="2"
                overflowY="auto"
                direction="column"
                maxHeight="calc(100vh - 240px)"
                className="custom-scrollbar"
              >
                <SwitcherMenuProvider value={switcherMenu}>
                  {filteredSessions.length ? (
                    filteredSessions.map((session) => (
                      <AccountSection
                        key={session._id}
                        session={session}
                        isExpanded={
                          isSearching || !collapsedIds.has(session._id)
                        }
                        onToggleSession={toggleSessionExpanded}
                      />
                    ))
                  ) : (
                    <Text color="muted" fontSize="sm" p="2">
                      No matching accounts, workspaces, or projects.
                    </Text>
                  )}
                </SwitcherMenuProvider>
              </Flex>

              <Divider />
              <CheckAccess
                entity={RoleAccountPermissionEntity.WORKSPACE}
                permission={RoleAccessAction.CREATE}
                scope={RoleType.ACCOUNT}
              >
                <Button
                  variant="ghost"
                  w="full"
                  justifyContent="flex-start"
                  fontWeight="normal"
                  rounded="none"
                  bg="bg.primary"
                  _hover={{ bg: "bg.subtle" }}
                  leftIcon={<Icon name="Plus" />}
                  onClick={() => {
                    closeSwitcher();
                    createWorkspaceDisclosure.onOpen();
                  }}
                >
                  Create a workspace
                </Button>
              </CheckAccess>
              <Button
                as={Link}
                to="/auth"
                variant="ghost"
                w="full"
                justifyContent="flex-start"
                fontWeight="normal"
                rounded="none"
                bg="bg.primary"
                _hover={{ bg: "bg.subtle" }}
                leftIcon={<Icon name="User" />}
                onClick={closeSwitcher}
              >
                Add an account
              </Button>
              <Button
                variant="ghost"
                w="full"
                justifyContent="flex-start"
                fontWeight="normal"
                rounded="none"
                bg="bg.primary"
                _hover={{ bg: "bg.subtle" }}
                color="red.600"
                leftIcon={<Icon name="LogOut" />}
                onClick={() => {
                  closeSwitcher();
                  handleSignOut();
                }}
              >
                Log out
              </Button>
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
      <CreateWorkspaceModal
        isOpen={createWorkspaceDisclosure.isOpen}
        isClosable={true}
        onClose={handleCreateWorkspaceModalClose}
      />

      <ProjectModal
        disclosure={createProjectDisclosure}
        onSubmit={handleCreateProjectSubmit}
      />
    </>
  );
};

export default WorkspaceSwitcher;
