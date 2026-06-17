import { ReactNode, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar, Button, Fade, Flex, Icon, Tooltip } from "@chakra-ui/react";
import {
  RoleType,
  FeatureFlag,
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";

import { useProject } from "shared/providers/ProjectContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

import IconButton from "shared/components/IconButton";
import CheckAccess from "shared/components/CheckAccess";
import TextEllipsis from "shared/components/TextEllipsis";
import CheckFeature from "shared/components/CheckFeature";
import ColorModeToggle from "shared/components/ColorModeToggle";
import WorkspaceSwitcher from "shared/components/WorkspaceSwitcher";
import {
  buildProjectBasePath,
  DEFAULT_PROJECT_SOURCE_TAB,
} from "shared/navigation/defaultProjectPath";
import { navbarExpandedWidth } from "shared/configs/project.configs";
import { NavCollapseIcon, NavExpandIcon } from "shared/icons";

import Users from "../Users";
import Branches from "../Branches";
import HeaderBreadcrumbs from "../HeaderBreadCrumbs";
import HeaderAgentChatButton from "./HeaderAgentChatButton";

export const WorkspaceHeaderBar = ({
  left,
  right,
}: {
  left: ReactNode;
  right?: ReactNode;
}) => {
  return (
    <Flex
      h="14"
      bg="bg.surface"
      alignItems="center"
      borderBottom="solid 1px"
      justifyContent="space-between"
      borderBottomColor="border.primary"
    >
      <Flex flex="1" alignItems="center" h="full" minW="0">
        {left}
      </Flex>
      <Flex
        pr="4"
        gap={2}
        zIndex="dropdown"
        alignItems="center"
        justifyContent="flex-end"
      >
        {right}
      </Flex>
    </Flex>
  );
};

const Header = () => {
  const { isPublic } = useWorkspace();
  const { isSandbox } = useProjectSandbox();

  return (
    <WorkspaceHeaderBar
      left={
        <>
          <HeaderWorkspaceInfo />
          <HeaderBreadcrumbs />
        </>
      }
      right={
        <>
          {isPublic && (
            <Flex alignItems="center" gap={2}>
              <Button
                data-tour={
                  isSandbox ? "mp-sandbox-get-started-free" : undefined
                }
                as={Link}
                target="_blank"
                rel="noreferrer"
                variant={isSandbox ? "primary" : "light"}
                borderRadius="12px"
                textDecoration="unset"
                to="https://go.multiplayer.app"
              >
                Get started for free
              </Button>
            </Flex>
          )}
          <ColorModeToggle />
          {!isPublic && (
            <>
              <HeaderAgentChatButton />
              <CheckFeature feature={FeatureFlag.PROJECT_BRANCH}>
                <CheckAccess
                  entity={RoleProjectPermissionEntity.PROJECT_BRANCH}
                  permission={RoleAccessAction.READ}
                  scope={RoleType.PROJECT}
                >
                  <Branches />
                </CheckAccess>
              </CheckFeature>
              <Users />
            </>
          )}
        </>
      }
    />
  );
};

const HeaderWorkspaceInfo = () => {
  const {
    workspace: { data: workspace },
    isPublic,
  } = useWorkspace();

  const { project, layoutState, setLayoutState } = useProject();
  const { workspaceId, projectId, branchId } = useParams();

  const workspaceName = workspace?.name || "Public";
  const projectAvatarSrc = project?.iconUrl || workspace?.iconUrl;
  const toggleNavbar = useCallback(() => {
    setLayoutState((prev) => ({
      ...prev,
      navbarExpanded: !prev.navbarExpanded,
    }));
  }, []);

  return (
    <>
      <Flex
        pl="4"
        pr="2"
        mr={{ base: 0, md: "2" }}
        h="full"
        gap="1"
        overflow="hidden"
        alignItems="center"
        bg={{ base: "transparent", md: "bg.primary" }}
        borderRight={{ base: "none", md: "solid 1px" }}
        borderRightColor={{ base: "transparent", md: "border.primary" }}
        transition="width 0.3s cubic-bezier(.87, 0, .13, 1)"
        width={layoutState.navbarExpanded ? navbarExpandedWidth : "64px"}
      >
        {!isPublic ? (
          <WorkspaceSwitcher
            size="sm"
            w="100%"
            minW="0"
            expanded={layoutState.navbarExpanded}
          />
        ) : (
          <Flex
            gap="2.5"
            flex="1"
            as={Link}
            minWidth="0"
            alignItems="center"
            to={
              !workspace || !workspaceId || !projectId || !branchId
                ? ``
                : `${buildProjectBasePath(
                    workspaceId,
                    projectId,
                    branchId,
                    isPublic
                  )}/${DEFAULT_PROJECT_SOURCE_TAB}`
            }
          >
            <Tooltip label={`${workspaceName} / ${project.name}`}>
              <Avatar
                size="sm"
                boxSize="8"
                borderRadius="base"
                name={workspaceName}
                src={projectAvatarSrc}
                position="relative"
                zIndex="1"
              />
            </Tooltip>

            <Flex
              as={Fade}
              in={layoutState.navbarExpanded}
              unmountOnExit
              minWidth="0"
              flex="1"
              flexDir="column"
              lineHeight="1.3"
              overflow="hidden"
            >
              <TextEllipsis fontWeight="medium">{project.name}</TextEllipsis>
              <TextEllipsis fontSize="xs" color="muted">
                {workspaceName}
              </TextEllipsis>
            </Flex>
          </Flex>
        )}
      </Flex>

      <ToggleNavbarButton
        expanded={layoutState.navbarExpanded}
        onToggle={toggleNavbar}
      />
    </>
  );
};

const ToggleNavbarButton = ({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) => {
  return (
    <IconButton
      size="sm"
      variant="base"
      onClick={onToggle}
      label={expanded ? "Collapse" : "Expand"}
      icon={
        <Icon boxSize="6" as={expanded ? NavCollapseIcon : NavExpandIcon} />
      }
    />
  );
};

export default Header;
