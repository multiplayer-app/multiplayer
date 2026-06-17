// React and routing
import { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";

// UI components
import { Button, ButtonGroup, Flex, Icon, IconButton } from "@chakra-ui/react";
import { DragDropContext } from "react-beautiful-dnd";

// Types
import { EntityType, IntegrationTypeEnum } from "@multiplayer/types";

// Icons and components
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "shared/icons";
import EntityIcon from "shared/components/EntityIcon";
import Droppable from "shared/components/Dnd/Droppable";
import Draggable from "shared/components/Dnd/Draggable";

// Context and hooks
import { ITab, NavigationMode, useTabs } from "shared/providers/TabsContext";
import { useEntities } from "shared/providers/EntitiesContext";

// Utils and configs
import { decodeFilePath, isBase64 } from "shared/utils";
import {
  entityCategoryMap,
  projectCategoryConfigs,
} from "shared/configs/project.configs";
import { ProjectSourceType } from "shared/models/enums";
import { integrationTypes } from "shared/configs/git.configs";

// Services
import { getDebugSession, getFlow } from "shared/services/radar.service";

const TabsHeader = () => {
  const location = useLocation();
  const { entities } = useEntities();
  const { sourceType, type, path, branchId, workspaceId, projectId } =
    useParams();
  const {
    tabs,
    setTabs,
    focusTab,
    onTabOpen,
    onFlowOpen,
    onEntityOpen,
    onSessionOpen,

    navigateToTab,
    closeTabById,
  } = useTabs();
  const selectedTab = location.pathname.split("/").pop();
  const selectedTabParts = useMemo(
    () => (isBase64(selectedTab) ? atob(selectedTab).split("/") : []),
    [selectedTab]
  );

  const findAndAddEntityTab = useCallback(
    (type: string, path: string, branchId: string) => {
      const entity = entities[entityCategoryMap[type]]?.find(
        (e) => e.entityId === path
      );
      if (entity) {
        onEntityOpen(entity, NavigationMode.NONE);
      }
    },
    [entities, onEntityOpen]
  );

  const findAndAddFileTab = useCallback(
    (type: string, path: string, branchId: string) => {
      const config = integrationTypes[type];
      if (!config) return;
      const [, , filePath] = decodeFilePath(path);
      if (filePath) {
        const fileName = filePath.split("/").pop();
        onTabOpen(
          {
            _id: path,
            key: fileName,
            originBranch: branchId,
            sourceType: ProjectSourceType.FILE,
            type: type as EntityType | IntegrationTypeEnum,
          },
          NavigationMode.NONE
        );
      }
    },
    [onTabOpen]
  );

  const findAndAddDebuggerTab = useCallback(async (id: string) => {
    if (id) {
      try {
        const session = await getDebugSession(workspaceId, projectId, id);
        onSessionOpen(session, NavigationMode.NONE);
      } catch (error) {
        console.log(error);
      }
    }
  }, []);

  const findAndAddFlowTab = useCallback(async (id: string) => {
    if (id) {
      try {
        const { metadata } = await getFlow(workspaceId, projectId, id);
        onFlowOpen(metadata, NavigationMode.NONE);
      } catch (error) {
        console.log(error);
      }
    }
  }, []);

  useEffect(() => {
    setTabs((prev) =>
      prev.map((t: ITab) => {
        const entityCategory = entityCategoryMap[t.type];
        if (!entityCategory) return t; // static filePreview tab
        const entity = entities[entityCategory].find(
          (e) => e.entityId === t._id
        );
        if (!entity) return t;
        return { ...t, key: entity.key };
      })
    );
  }, [entities, setTabs]);

  useEffect(() => {
    if (path) {
      const isEntityOpen = tabs.some((t) => t._id === path);
      if (isEntityOpen) return;
      switch (sourceType) {
        case ProjectSourceType.ENTITY:
          findAndAddEntityTab(type, path, branchId);
          break;
        case ProjectSourceType.FILE:
          findAndAddFileTab(type, path, branchId);
          break;
        case ProjectSourceType.DEBUGGER:
          findAndAddDebuggerTab(path);
          break;
        case ProjectSourceType.FLOWS:
          findAndAddFlowTab(path);
          break;
        default:
          break;
      }
    } else {
      const configs = projectCategoryConfigs[sourceType];
      if (configs) {
        onTabOpen({
          _id: sourceType,
          key: configs.name,
          sourceType: sourceType as ProjectSourceType,
        });
      }
    }
  }, [path, type, branchId, sourceType]);

  useLayoutEffect(() => {
    document.getElementById(path)?.scrollIntoView();
  }, [path]);

  const selectPrevTab = () => {
    const currentId = path || sourceType;
    const index = tabs.findIndex((t) => t._id === currentId);
    const prevIndex = index ? index - 1 : tabs.length - 1;
    const prevTab = tabs[prevIndex];
    if (prevTab) {
      navigateToTab(prevTab);
    }
  };

  const selectNextTab = () => {
    const currentId = path || sourceType;
    const index = tabs.findIndex((t) => t._id === currentId);
    const nextIndex = index !== tabs.length - 1 ? index + 1 : 0;
    const nextTab = tabs[nextIndex];
    if (nextTab) {
      navigateToTab(nextTab);
    }
  };

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = reorder(
      tabs,
      result.source.index,
      result.destination.index
    ) as ITab[];

    setTabs(items);
  };

  return (
    <Flex
      bg="bg.muted"
      alignItems="center"
      className="hidden-scrollbar"
      sx={{
        "> div:first-of-type": {
          flex: "1",
          pt: "0.5",
          mt: "-0.5",
          minH: "50px",
          overflow: "auto",
          whiteSpace: "nowrap",
        },
      }}
    >
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable direction="horizontal" droppableId="droppable">
          {tabs.map((tab, index) => {
            const { _id, sourceType, type, key } = tab;
            const tabParts = isBase64(_id) ? atob(_id).split("/") : [];
            // parts are set in the TabsContext with following sequence
            // ${repoId}/${branch}/${filePath}
            // we compare repoId and filePath
            // even if branch differs between same files, we show the tab as selected

            const isTabSelected =
              sourceType === ProjectSourceType.FILE &&
              selectedTabParts[0] === tabParts[0] &&
              selectedTabParts[2] === tabParts[2];

            return (
              <Draggable
                key={_id}
                index={index}
                draggableId={_id}
                draggingBackground={isTabSelected ? "inherit" : "#e2e8f0"}
              >
                <Button
                  h="12"
                  px="4"
                  gap="2"
                  id={_id}
                  key={_id}
                  end={true}
                  as={NavLink}
                  replace={true}
                  borderRadius="0"
                  variant="unstyled"
                  display="inline-flex"
                  state={location?.state}
                  background={isTabSelected ? "bg.primary" : "unset"}
                  boxShadow={isTabSelected ? "0 -2px 0 #18DE97" : "unset"}
                  to={`${sourceType}${type ? `/${type}/${_id}` : ""}`}
                  onClick={focusTab}
                  leftIcon={<EntityIcon name={type || sourceType} />}
                  fontStyle={tab.isTemp ? "italic" : "normal"}
                  rightIcon={
                    <Icon
                      as={CloseIcon}
                      color="muted"
                      pointerEvents="all"
                      transition="color 0.2s cubic-bezier(.87, 0, .13, 1)"
                      onClick={(e) => {
                        e.preventDefault();
                        closeTabById(tab._id);
                      }}
                    />
                  }
                  _activeLink={{
                    bg: "bg.primary",
                    boxShadow: "0 -2px 0 #18DE97",
                  }}
                  cursor="pointer !important"
                >
                  {key}
                </Button>
              </Draggable>
            );
          })}
        </Droppable>
      </DragDropContext>

      {tabs.length > 1 ? (
        <ButtonGroup size="sm" isAttached variant="ghost" mx="4">
          <IconButton
            aria-label="Prev tab"
            icon={<Icon as={ChevronLeftIcon} />}
            onClick={selectPrevTab}
          />
          <IconButton
            aria-label="Next tab"
            icon={<Icon as={ChevronRightIcon} />}
            onClick={selectNextTab}
          />
        </ButtonGroup>
      ) : null}
    </Flex>
  );
};

export default TabsHeader;
