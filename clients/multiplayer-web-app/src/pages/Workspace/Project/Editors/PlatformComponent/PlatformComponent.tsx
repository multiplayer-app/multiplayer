import { useDisclosure } from "@chakra-ui/react";
import { EntityType } from "@multiplayer/types";

import { IEditorProps } from "shared/models/interfaces";
import LazyContent, { lazyModule } from "shared/components/LazyContent";
import useYUndoManager from "shared/hooks/useYUndoManager";
import { useVersion } from "shared/providers/VersionContext";
import { ThreadsProvider } from "shared/providers/ThreadsContext";
import EntityThreadsDrawer from "shared/components/EntityThreadsDrawer";
import {
  FullScreenContentContainer,
  FullScreenProvider,
} from "shared/providers/FullScreenContext";

import PlatformComponentToolbar from "./PlatformComponentToolbar";
import { useActiveTabState } from "shared/providers/TabsContext";
import GitRefToolbar from "shared/components/GitRefToolbar";

const PlatformComponentEditor = lazyModule(
  () => import("shared/components/Editors/PlatformComponentEditor")
);

const PlatformComponent = ({
  doc,
  clients,
  provider,
  readonly,
  openedIn,
}: IEditorProps & { openedIn: "tab" | "drawer" }) => {
  const [{ showChanges }, setActiveTabState] = useActiveTabState({
    showChanges: false,
  });

  const undoManager = useYUndoManager([
    doc?.getMap("name"),
    doc?.getMap("information"),
    doc?.getMap("environmentVariables"),
    doc?.getXmlFragment("description"),
  ]);
  const entityThreadsDisclosure = useDisclosure();
  const { currentBranchId } = useVersion();

  return (
    <FullScreenProvider direction="column" flex="1" minH="0">
      <ThreadsProvider branchId={currentBranchId} objectId={provider.entityId}>
        <PlatformComponentToolbar
          readonly={readonly}
          undoManager={undoManager}
          showChanges={showChanges}
          setShowChanges={(value) => {
            setActiveTabState({ showChanges: value });
          }}
          entityThreadsDisclosure={entityThreadsDisclosure}
        />
        <GitRefToolbar />
        <FullScreenContentContainer
          flex="1"
          minH="0"
          minW="0"
          overflowX="auto"
          position="relative"
        >
          <LazyContent
            element={
              <PlatformComponentEditor
                doc={doc}
                provider={provider}
                clients={clients}
                openedIn={openedIn}
                readonly={readonly}
                showChanges={showChanges}
                undoManager={undoManager.instance.current}
              />
            }
          />
          {entityThreadsDisclosure.isOpen && (
            <EntityThreadsDrawer
              onClose={entityThreadsDisclosure.onClose}
              entityType={EntityType.PLATFORM_COMPONENT}
            />
          )}
        </FullScreenContentContainer>
      </ThreadsProvider>
    </FullScreenProvider>
  );
};
export default PlatformComponent;
