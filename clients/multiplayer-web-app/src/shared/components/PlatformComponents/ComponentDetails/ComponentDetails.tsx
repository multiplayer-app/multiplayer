import { Flex } from "@chakra-ui/react";
import { EntityType } from "@multiplayer/types";

import Toolbar, {
  ToolbarButton,
  ToolbarButtonGroup,
} from "shared/components/Toolbar";
import {
  MultiplayerStateProvider,
  useMultiplayerStateContext,
} from "shared/providers/MultiplayerStateContext";
import useYUndoManager from "shared/hooks/useYUndoManager";
import { CloseIcon, RedoIcon, UndoIcon } from "shared/icons";
import LazyContent, { lazyModule } from "shared/components/LazyContent";
import { FullScreenProvider } from "shared/providers/FullScreenContext";
import OpenInTabButton from "shared/components/OpenInTabButton";

const PlatformComponentEditor = lazyModule(
  () => import("shared/components/Editors/PlatformComponentEditor")
);

const ComponentDetails = ({
  projectId,
  branchId,
  componentId,
  readonly,
  onClose,
}: {
  projectId: string;
  branchId: string;
  readonly: boolean;
  componentId: string;
  onClose: () => void;
}) => {
  return (
    <Flex
      overflow="auto"
      direction="column"
      position="relative"
      minH="full"
      height="full"
    >
      <MultiplayerStateProvider
        branchId={branchId}
        projectId={projectId}
        entityId={componentId}
        entityType={EntityType.PLATFORM_COMPONENT}
      >
        <PlatformComponentContainer readonly={readonly} onClose={onClose} />
      </MultiplayerStateProvider>
    </Flex>
  );
};

const PlatformComponentContainer = ({ readonly, onClose }) => {
  const { doc, clients, provider } = useMultiplayerStateContext();

  const undoManager = useYUndoManager([
    doc?.getMap("name"),
    doc?.getMap("information"),
    doc?.getMap("environmentVariables"),
    doc?.getXmlFragment("description"),
  ]);

  return (
    <FullScreenProvider direction="column" flex="1" minH="0">
      <Flex position="relative" flex="1" minH="0" minW="0" overflowX="auto">
        <Flex position="absolute" right="0">
          <Toolbar
            zIndex="1"
            border="0"
            bg="transparent"
            rightContent={
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

                <OpenInTabButton
                  id={provider?.entityId}
                  type={EntityType.PLATFORM_COMPONENT}
                />

                <ToolbarButton
                  icon={<CloseIcon />}
                  label="Close"
                  onClick={onClose}
                />
              </ToolbarButtonGroup>
            }
          ></Toolbar>
        </Flex>
        <LazyContent
          element={
            <PlatformComponentEditor
              doc={doc}
              clients={clients}
              provider={provider}
              readonly={readonly}
              openedIn="drawer"
              undoManager={undoManager.instance.current}
            />
          }
        />
      </Flex>
    </FullScreenProvider>
  );
};

export default ComponentDetails;
