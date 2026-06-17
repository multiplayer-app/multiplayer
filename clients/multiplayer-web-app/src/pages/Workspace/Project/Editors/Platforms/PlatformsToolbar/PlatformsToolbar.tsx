import { HamburgerIcon } from "@chakra-ui/icons";
import { Icon, Button } from "@chakra-ui/react";
import { VisualizationType } from "@multiplayer/types";

import {
  UndoIcon,
  RedoIcon,
  AddComponentIcon,
  GroupOutlineIcon,
  SidebarIcon,
} from "shared/icons";
import Toolbar, {
  ToolbarButton,
  ToolbarButtonGroup,
} from "shared/components/Toolbar";
import VersionsHistory from "shared/components/VersionsHistory";
import { useDiagramState } from "shared/providers/DiagramContext";
import CommentsToggleButton from "shared/components/CommentsToggleButton";
import HighlightingModeToggle from "shared/components/HighlightingModeToggle";
import FullScreenToggleButton from "shared/components/FullScreenToggleButton";
import { isDynamicView as isDynamicViewFn } from "shared/helpers/diagram.helpers";
import { useVersion } from "shared/providers/VersionContext";
import { SystemViewTypes } from "shared/models/enums";

import ToolSwitcher from "./ToolSwitcher";
import LayoutSwitcher from "./LayoutSwitcher";

import PlatformRadar from "../PlatformRadar";
import VisualizationTypeMenu from "../VisualizationTypeMenu";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

const PlatformsToolbar = ({
  editor,
  isEmpty,
  sourceName,
  isReadonly,
  undoManager,
  onViewRename,
  changesViewMode,
  visualizationType,
  setChangesViewMode,
  viewsDrawerDisclosure,
  changeVisualizationType,
  entityThreadsDisclosure,
  showVisualizationTypeMenu,
  componentsModalDisclosure,
  propertiesDrawerDisclosure,
}) => {
  const state = useDiagramState();
  const { currentBranch } = useVersion();
  const { isSandbox } = useProjectSandbox();

  const getViewName = () => {
    if (state.views && state.currentViewId) {
      return state.views[state.currentViewId]?.name || "Deleted view";
    } else {
      return null;
    }
  };

  const isDiagramView = visualizationType === VisualizationType.DIAGRAM;
  const isDynamicView = isDynamicViewFn(state.currentViewId);
  const isAllView = state.currentViewId === SystemViewTypes.ALL;

  return (
    <Toolbar
      leftContent={
        <>
          <Button
            size="sm"
            variant="light"
            borderRadius="20px"
            cursor="pointer"
            leftIcon={<Icon as={HamburgerIcon} />}
            onClick={viewsDrawerDisclosure.onToggle}
          >
            Views
          </Button>
          {showVisualizationTypeMenu && (
            <VisualizationTypeMenu
              disabled={isEmpty}
              onViewRename={() => onViewRename(state.currentViewId)}
              currentViewName={getViewName()}
              currentViewId={state.currentViewId}
              visualizationType={visualizationType}
              onVisualizationTypeSelect={changeVisualizationType}
            />
          )}
        </>
      }
      middleContent={
        isReadonly && !isSandbox ? null : (
          <>
            {isDiagramView && <ToolSwitcher editor={editor} />}
            <ToolbarButton
              icon={<SidebarIcon />}
              onClick={propertiesDrawerDisclosure.onToggle}
              isActive={propertiesDrawerDisclosure.isOpen}
              label={
                propertiesDrawerDisclosure.isOpen
                  ? `Close ${sourceName} information`
                  : `Open ${sourceName} information`
              }
            />
            <ToolbarButton
              enforceSandboxCheck={isSandbox}
              disabled={isDynamicView}
              icon={<AddComponentIcon />}
              onClick={componentsModalDisclosure.onOpen}
              label="Add Components"
            />
            {isDiagramView && (
              <ToolbarButton
                enforceSandboxCheck={isSandbox}
                disabled={isDynamicView}
                icon={<GroupOutlineIcon />}
                onClick={editor.createGroup}
                label="Add Group"
              />
            )}
            <CommentsToggleButton
              disclosure={entityThreadsDisclosure}
              enforceSandboxCheck={isSandbox}
            />
            <FullScreenToggleButton />
            {isAllView ? <PlatformRadar editor={editor} /> : null}
            {isDiagramView && !currentBranch.data.default && !isDynamicView && (
              <HighlightingModeToggle
                value={changesViewMode}
                onChange={setChangesViewMode}
              />
            )}
          </>
        )
      }
      rightContent={
        isReadonly && !isSandbox ? null : (
          <>
            {isDiagramView ? (
              <LayoutSwitcher editor={editor} state={state} />
            ) : null}
            <ToolbarButtonGroup>
              <ToolbarButton
                icon={<UndoIcon />}
                enforceSandboxCheck={isSandbox}
                disabled={!undoManager.canUndo}
                onClick={() => {
                  undoManager.undo();
                }}
                label="Undo"
              />
              <ToolbarButton
                icon={<RedoIcon />}
                enforceSandboxCheck={isSandbox}
                disabled={!undoManager.canRedo}
                onClick={() => {
                  undoManager.redo();
                }}
                label="Redo"
              />
            </ToolbarButtonGroup>
            <VersionsHistory />
          </>
        )
      }
    />
  );
};

export default PlatformsToolbar;
