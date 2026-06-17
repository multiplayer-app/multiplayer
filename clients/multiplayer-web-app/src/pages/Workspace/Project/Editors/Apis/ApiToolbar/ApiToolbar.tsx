import { Button, Flex, Icon, UseDisclosureReturn } from "@chakra-ui/react";
import {
  ViewIcon,
  RedoIcon,
  UndoIcon,
  HamburgerIcon,
  SidebarIcon,
  ReloadIcon,
} from "shared/icons";
import { useMemo, useState } from "react";
import Toolbar, {
  ToolbarButton,
  ToolbarButtonGroup,
} from "shared/components/Toolbar";
import { useApis } from "shared/providers/ApisContext";
import { ToolbarToggle } from "shared/components/Toolbar";

import HighlightingModeToggle from "shared/components/HighlightingModeToggle";
import FullScreenToggleButton from "shared/components/FullScreenToggleButton";
import VersionsHistory from "shared/components/VersionsHistory";
import CommentsToggleButton from "shared/components/CommentsToggleButton";
import { useRefetch } from "shared/providers/RefetchContext";
import { RefetchTargetType } from "shared/models/enums";

const ApiToolbar = ({
  entityThreadsDisclosure,
}: {
  entityThreadsDisclosure: UseDisclosureReturn;
}) => {
  const {
    viewMode,
    viewModes,
    undoManager,
    viewsDisclosure,
    highlightingMode,
    showHighlightingModeToggle,
    apiPropertiesDrawerDisclosure,
    onViewModeChange,
    onHighlightingModeChange,
  } = useApis();
  const { onRefetch } = useRefetch();
  const [refetchIndex, setRefetchIndex] = useState(0);

  const handleRefetch = () => {
    setRefetchIndex(refetchIndex + 1);
    onRefetch(RefetchTargetType.API);
  };

  return (
    <Toolbar
      bg="bg.primary"
      leftContent={
        <>
          <Button
            size="sm"
            variant="light"
            borderRadius="20px"
            cursor="pointer"
            leftIcon={<Icon as={HamburgerIcon} />}
            onClick={viewsDisclosure.onToggle}
          >
            Views
          </Button>
          <ViewName />
          <ToolbarToggle
            buttons={viewModes}
            value={viewMode}
            onChange={onViewModeChange}
          />
        </>
      }
      middleContent={
        <>
          <ToolbarButton
            icon={<SidebarIcon />}
            onClick={() => {
              apiPropertiesDrawerDisclosure.onToggle();
            }}
            isActive={apiPropertiesDrawerDisclosure.isOpen}
            label={
              apiPropertiesDrawerDisclosure.isOpen
                ? "Close API Information"
                : "Open API Information"
            }
          />
          <CommentsToggleButton disclosure={entityThreadsDisclosure} />
          <FullScreenToggleButton />
          {showHighlightingModeToggle && (
            <HighlightingModeToggle
              value={highlightingMode}
              onChange={onHighlightingModeChange}
            />
          )}
        </>
      }
      rightContent={
        <>
          <ToolbarButton
            icon={
              <Icon
                as={ReloadIcon}
                transition="transform 0.3s linear"
                transform={`rotate(${-360 * refetchIndex}deg)`}
              />
            }
            label="Reload"
            onClick={handleRefetch}
          />
          <ToolbarButtonGroup>
            <ToolbarButton
              icon={<UndoIcon />}
              disabled={!undoManager.canUndo}
              onClick={undoManager.undo}
              label="Undo"
            />

            <ToolbarButton
              icon={<RedoIcon />}
              disabled={!undoManager.canRedo}
              onClick={undoManager.redo}
              label="Redo"
            />
          </ToolbarButtonGroup>
          <VersionsHistory />
        </>
      }
    />
  );
};

const ViewName = () => {
  const { currentView, customViews, systemViews } = useApis();
  const viewName = useMemo(() => {
    if (!currentView) return null;
    const isSystemView = currentView.startsWith("_");
    if (isSystemView) {
      return systemViews.find((v) => v.id === currentView)?.name;
    } else {
      return customViews[currentView]?.name;
    }
  }, [currentView, systemViews]);

  if (!viewName) return null;

  return (
    <Flex mx="2" alignItems="center" whiteSpace="nowrap">
      <Icon as={ViewIcon} color="muted" w="16px" mr="8px"></Icon>
      {viewName}
    </Flex>
  );
};

export default ApiToolbar;
