import { useEffect } from "react";
import { EntityType } from "@multiplayer/types";
import { useDisclosure } from "@chakra-ui/react";

import { IEditorProps } from "shared/models/interfaces";
import useYUndoManager from "shared/hooks/useYUndoManager";
import { useVersion } from "shared/providers/VersionContext";
import { ThreadsProvider } from "shared/providers/ThreadsContext";
import {
  FullScreenContentContainer,
  FullScreenProvider,
} from "shared/providers/FullScreenContext";

import EntityThreadsDrawer from "shared/components/EntityThreadsDrawer";
import { DocumentEditorStateLess } from "shared/components/Editors/DocumentEditor";

import DocumentToolbar from "./DocumentToolbar";
import useYMapState from "shared/hooks/useYMapState";
import DocumentVariablesDrawer from "./DocumentVariablesDrawer";
import EntityDetailsDrawer from "shared/components/EntityDetailsDrawer";
import { DocumentEditorProvider } from "shared/components/Editors/DocumentEditor/DocumentEditorContext";

const Document = ({ doc, provider, readonly = false }: IEditorProps) => {
  const { currentBranchId } = useVersion();
  const entityThreadsDisclosure = useDisclosure();
  const propertiesDrawerDisclosure = useDisclosure();
  const documentVariablesDisclosure = useDisclosure();

  const undoManager = useYUndoManager([
    doc?.getXmlFragment("xml"),
    doc?.getMap("environments"),
  ]);

  const [nameMap] = useYMapState<{ name: string }>(doc.getMap("name"));

  useEffect(() => {
    if (entityThreadsDisclosure.isOpen) {
      documentVariablesDisclosure.onClose();
    }
  }, [entityThreadsDisclosure.isOpen]);

  useEffect(() => {
    if (documentVariablesDisclosure.isOpen) {
      entityThreadsDisclosure.onClose();
    }
  }, [documentVariablesDisclosure.isOpen]);

  return (
    <ThreadsProvider branchId={currentBranchId} objectId={provider.entityId}>
      <FullScreenProvider direction="column" flex="1" minH="0" bg="bg.primary">
        <DocumentEditorProvider
          doc={doc}
          allowComments
          allowRunnableBlocks
          provider={provider}
          readonly={readonly}
          undoManager={undoManager.instance.current}
        >
          <DocumentToolbar
            readonly={readonly}
            undoManager={undoManager}
            entityThreadsDisclosure={entityThreadsDisclosure}
            documentVariablesDisclosure={documentVariablesDisclosure}
            propertiesDrawerDisclosure={propertiesDrawerDisclosure}
          />
          <FullScreenContentContainer flex="1" minH="0" position="relative">
            <DocumentEditorStateLess
              entityThreadsDisclosure={entityThreadsDisclosure}
            />
            {entityThreadsDisclosure.isOpen && (
              <EntityThreadsDrawer
                onClose={entityThreadsDisclosure.onClose}
                entityType={EntityType.NOTEBOOK}
              />
            )}
            {documentVariablesDisclosure.isOpen && (
              <DocumentVariablesDrawer
                doc={doc}
                readonly={readonly}
                onClose={documentVariablesDisclosure.onClose}
              />
            )}
            {propertiesDrawerDisclosure.isOpen && (
              <EntityDetailsDrawer
                readonly={readonly}
                entityId={provider.entityId}
                entityName={nameMap.name}
                entityType={EntityType.NOTEBOOK}
                onClose={() => propertiesDrawerDisclosure.onClose()}
              />
            )}
          </FullScreenContentContainer>
        </DocumentEditorProvider>
      </FullScreenProvider>
    </ThreadsProvider>
  );
};

export default Document;
