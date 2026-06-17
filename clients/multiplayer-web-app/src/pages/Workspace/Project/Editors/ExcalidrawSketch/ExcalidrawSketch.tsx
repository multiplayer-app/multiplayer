import { useState } from "react";
import { useDisclosure } from "@chakra-ui/react";
import { EntityType } from "@multiplayer/types";
import { IEditorProps } from "shared/models/interfaces";
import { useVersion } from "shared/providers/VersionContext";
import { ThreadsProvider } from "shared/providers/ThreadsContext";
import {
  FullScreenContentContainer,
  FullScreenProvider,
} from "shared/providers/FullScreenContext";
import {
  ExcalidrawProvider,
  ViewportState,
} from "shared/providers/ExcalidrawContext";
import EntityThreadsDrawer from "shared/components/EntityThreadsDrawer";
import { ExcalidrawEditorContent } from "shared/components/Editors/ExcalidrawEditor";

import ExcalidrawSketchToolbar from "./ExcalidrawSketchToolbar";
import ExcalidrawComments from "./ExcalidrawComments";
import { useActiveTabState } from "shared/providers/TabsContext";
import "./ExcalidrawSketch.scss";
import EntityDetailsDrawer from "shared/components/EntityDetailsDrawer";
import useYMapState from "shared/hooks/useYMapState";

const ExcalidrawSketch = ({ doc, readonly, provider }: IEditorProps) => {
  const { currentBranchId } = useVersion();
  const entityThreadsDisclosure = useDisclosure();
  const propertiesDrawerDisclosure = useDisclosure();
  const [commentMode, setCommentMode] = useState(false);
  const [tabState, setTabState] = useActiveTabState<ViewportState>();

  const [nameMap] = useYMapState<{ name: string }>(doc.getMap("name"));

  const onCloseSketchThreads = () => {
    setCommentMode(false);
    entityThreadsDisclosure.onClose();
  };

  return (
    <FullScreenProvider
      flex="1"
      minH="0"
      bg="bg.surface"
      direction="column"
      className={commentMode ? "comment-mode" : ""}
    >
      <ExcalidrawProvider
        provider={provider}
        doc={doc}
        tabState={tabState}
        setTabState={setTabState}
      >
        <ThreadsProvider
          branchId={currentBranchId}
          objectId={provider.entityId}
        >
          <ExcalidrawSketchToolbar
            readonly={readonly}
            commentMode={commentMode}
            setCommentMode={setCommentMode}
            entityThreadsDisclosure={entityThreadsDisclosure}
            propertiesDrawerDisclosure={propertiesDrawerDisclosure}
          />

          <FullScreenContentContainer
            flex="1"
            minH="0"
            position="relative"
            zIndex={10}
            overflow="auto"
            bg="bg.primary"
          >
            <ExcalidrawEditorContent
              setCommentMode={setCommentMode}
              commentMode={commentMode}
              readonly={readonly}
            >
              <ExcalidrawComments commentMode={commentMode} />
            </ExcalidrawEditorContent>

            {entityThreadsDisclosure.isOpen && (
              <EntityThreadsDrawer
                onClose={onCloseSketchThreads}
                entityType={EntityType.EXCALIDRAW}
              />
            )}
            {propertiesDrawerDisclosure.isOpen && (
              <EntityDetailsDrawer
                readonly={readonly}
                entityId={provider.entityId}
                entityName={nameMap.name}
                entityType={EntityType.EXCALIDRAW}
                onClose={() => propertiesDrawerDisclosure.onClose()}
              />
            )}
          </FullScreenContentContainer>
        </ThreadsProvider>
      </ExcalidrawProvider>
    </FullScreenProvider>
  );
};

export default ExcalidrawSketch;
