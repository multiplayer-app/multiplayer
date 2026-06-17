import { Link, useParams } from "react-router-dom";
import { useCallback, useMemo, memo } from "react";
import { Box, Icon, Flex, Text, IconButton } from "@chakra-ui/react";

import { ReactComponent as ChevronLeft } from "assets/images/icons/chevron-left.svg";

import {
  projectNavItems,
  projectCategoryConfigs,
  navbarExpandedWidth,
  getPathForConfig,
} from "shared/configs/project.configs";

import { ChangesIcon, CogOIcon, QuestionIcon } from "shared/icons";
import { NavBarItemType } from "shared/models/interfaces";
import CategoryIcon from "shared/components/CategoryIcon";
import ResizableBox from "shared/components/ResizableBox";

import { useTabs } from "shared/providers/TabsContext";
import { useVersion } from "shared/providers/VersionContext";
import { useProject } from "shared/providers/ProjectContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import { useProjectModals } from "shared/providers/ProjectModalsContext";
import { useSharedGeneralModals } from "shared/providers/GeneralModalsContext";
import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import Explorer from "./Explorer";
import NavbarNavItem from "./NavbarNavItem";
import DebugSessionWidget from "./DebugSessionWidget";
import CheckAccess from "shared/components/CheckAccess";
import { buildProjectBasePath } from "shared/navigation/defaultProjectPath";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { useVisibility } from "shared/components/Visibility";

interface NavbarProps {
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
}

const Navbar = ({ selected, setSelected }: NavbarProps) => {
  const { onTabOpen } = useTabs();
  const { hasFeature } = usePermissions();
  const { isSandbox } = useProjectSandbox();
  const isMobile = useVisibility({ base: true, md: false });
  const { layoutState, setLayoutState } = useProject();

  const { navbarExpanded, explorerExpanded } = layoutState;

  const getConfigs = useCallback((category: string) => {
    const baseConfigs = projectCategoryConfigs[category];
    return baseConfigs;
  }, []);

  const configs = useMemo(() => getConfigs(selected), [selected, getConfigs]);

  const toggleExplorer = useCallback(() => {
    setLayoutState((prev) => ({
      ...prev,
      explorerExpanded: !prev.explorerExpanded,
    }));
  }, []);

  const onCategoryClick = useCallback(
    (category: string) => {
      setSelected(category);
      const config = getConfigs(category);
      if (config.showExplorer) {
        if (selected === category || !explorerExpanded) {
          toggleExplorer();
        }
      }
    },
    [selected, toggleExplorer, getConfigs, setSelected, onTabOpen]
  );

  const filteredNavItems = useMemo(
    () =>
      projectNavItems.filter((key) => {
        const config = projectCategoryConfigs[key];
        return !config.featureFlag || hasFeature(config.featureFlag);
      }),
    [hasFeature]
  );
  const isExpanded = isMobile || navbarExpanded;
  const navbarWidth = isExpanded ? navbarExpandedWidth : "64px";

  const navbarItems = useMemo(
    () =>
      filteredNavItems.map((category) => {
        let props = { to: undefined, as: undefined };
        const isSelected = selected === category;
        const config = getConfigs(category);

        if (!config?.showExplorer && config.type === NavBarItemType.link) {
          props = { as: Link, to: getPathForConfig(config) };
        }

        return (
          <NavbarNavItem
            {...props}
            key={category}
            label={config.name}
            isSelected={isSelected}
            isExpanded={isExpanded}
            icon={<CategoryIcon boxSize="6" name={category} />}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              if ((e.metaKey || e.ctrlKey) && props.to) return;
              onCategoryClick(category);
            }}
          />
        );
      }),
    [filteredNavItems, isExpanded, selected, getConfigs, onCategoryClick]
  );

  return (
    <Flex
      top="14"
      bottom="0"
      flexShrink={0}
      zIndex={{ base: 29, md: "auto" }}
      position={{ base: "fixed", md: "static" }}
      transition="left .3s cubic-bezier(.87, 0, .13, 1)"
      left={{ base: navbarExpanded ? 0 : `-${navbarWidth}`, md: "0" }}
    >
      <Flex
        py="2"
        gap="2"
        flexShrink={0}
        bg="bg.primary"
        flexDir="column"
        overflowY="auto"
        overflowX="hidden"
        borderRight="1px"
        fontWeight="medium"
        borderColor="border.primary"
        className="hidden-scrollbar"
        minW={navbarWidth}
        width={navbarWidth}
        transition="width .3s cubic-bezier(.87, 0, .13, 1)"
        data-tour={isSandbox ? "mp-sandbox-sidebar-nav" : undefined}
      >
        {navbarItems}
        <Box my="auto" />
        <ChangesNavItem titlesExpanded={isExpanded} />
        <SettingsNavItem titlesExpanded={isExpanded} />
        <SupportNavItem titlesExpanded={isExpanded} />
        <DebugSessionWidget isExpanded={isExpanded} />
      </Flex>
      {explorerExpanded && configs?.showExplorer && (
        <ResizableBox
          p="4"
          as={Flex}
          flexDir="column"
          borderRight="solid 1px"
          borderRightColor="border.primary"
          w={configs.navbarWidth}
        >
          <Flex alignItems="center">
            <Text flex="1">{configs.name}</Text>
            <IconButton
              size="sm"
              variant="base"
              backgroundColor="bg.surface"
              boxShadow="0 1px 2px 0 #0000000F, 0 1px 3px 0 #0000001A"
              borderRadius="5px"
              color="muted"
              aria-label="Collapse"
              icon={<ChevronLeft />}
              onClick={toggleExplorer}
            />
          </Flex>
          <Explorer selected={selected} />
        </ResizableBox>
      )}
    </Flex>
  );
};

const SettingsNavItem = memo(
  ({ titlesExpanded }: { titlesExpanded: boolean }) => {
    const { workspaceId, projectId, branchId } = useParams();
    const { isPublic } = useWorkspace();
    const settingsPath =
      workspaceId && projectId && branchId
        ? `${buildProjectBasePath(
            workspaceId,
            projectId,
            branchId,
            isPublic
          )}/settings/project`
        : "settings/project";

    return (
      <CheckAccess
        permission={RoleAccessAction.UPDATE}
        entity={RoleWorkspacePermissionEntity.PROJECT}
      >
        <NavbarNavItem
          as={Link}
          to={settingsPath}
          label="Settings"
          isExpanded={titlesExpanded}
          icon={<Icon boxSize="6" as={CogOIcon} color="muted" />}
        />
      </CheckAccess>
    );
  }
);

const SupportNavItem = memo(
  ({ titlesExpanded }: { titlesExpanded: boolean }) => {
    const { openContactModal } = useSharedGeneralModals();
    const handleSupportClick = () => {
      openContactModal();
    };

    return (
      <NavbarNavItem
        label="Support"
        isExpanded={titlesExpanded}
        onClick={handleSupportClick}
        icon={<Icon boxSize="6" as={QuestionIcon} color="muted" />}
      />
    );
  }
);

const ChangesNavItem = memo(
  ({ titlesExpanded }: { titlesExpanded: boolean }) => {
    const { currentBranch, isCurrentBranchLocked } = useVersion();
    const { openChangesModal } = useProjectModals();

    if (currentBranch.data.default || isCurrentBranchLocked) {
      return null;
    }

    return (
      <NavbarNavItem
        label="Changes"
        isExpanded={titlesExpanded}
        onClick={() => openChangesModal(currentBranch.data)}
        icon={<Icon boxSize="6" as={ChangesIcon} color="muted" />}
      />
    );
  }
);

export default memo(Navbar);
