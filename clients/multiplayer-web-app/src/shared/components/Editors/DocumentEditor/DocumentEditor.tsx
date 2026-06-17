import { useEffect, useMemo } from "react";
import { Flex, UseDisclosureReturn, useColorMode } from "@chakra-ui/react";
import { BlockEditor, useBlockEditor } from "@multiplayer/blocknote";
import { ScrollSyncPane } from "react-scroll-sync";
import { UndoManager } from "yjs";

import "@multiplayer/blocknote/dist/style.css";

import DocumentComments from "./DocumentComments";

import { IEditorProps } from "shared/models/interfaces";
import { useWorkspace } from "shared/providers/WorkspaceContext";

import "./DocumentEditor.scss";
import { UseNotebookDebuggerReturn } from "shared/hooks/useNotebookDebugger";
import { useParams } from "react-router-dom";
import { notebookInstance, apiInstance } from "shared/api";
import { useVersion } from "shared/providers/VersionContext";

export interface DocumentEditorProps extends IEditorProps<any> {
  fieldName?: string;
  markdown?: boolean;
  extensions?: any[];
  undoManager?: UndoManager;
  notebookDebugger?: UseNotebookDebuggerReturn;
  entityThreadsDisclosure?: UseDisclosureReturn;
}

const DocumentEditor = ({
  doc,
  provider,
  readonly,
  extensions,
  initialData,
  undoManager,
  allowComments,
  fieldName = "xml",
  notebookDebugger,
  entityThreadsDisclosure,
  onChange,
}: DocumentEditorProps) => {
  const { user } = useWorkspace();
  const { colorMode } = useColorMode();
  const { currentBranchId } = useVersion();
  const { workspaceId, projectId } = useParams();

  const { proxy, aiAssistant } = useMemo(() => {
    const basePath = `/workspaces/${workspaceId}/projects/${projectId}`;
    return {
      proxy: { apiInstance: notebookInstance, path: `${basePath}/proxy` },
      aiAssistant: {
        apiInstance: apiInstance,
        path: `${basePath}/branches/${currentBranchId}/assistant/generate`,
      },
    };
  }, []);

  const editor = useBlockEditor(
    {
      allowComments,
      autofocus: false,
      editable: !readonly,
      user: {
        id: user?.data?._id,
        color: user?.data?.color,
        name: user?.data?.username,
      },
      proxy,
      aiAssistant,
      notebookDebugger: notebookDebugger?.instance,
      ...(doc && provider
        ? {
            collaboration: {
              provider,
              undoManager,
              fragment: doc.getXmlFragment(fieldName),
            },
          }
        : {}),
      ...(extensions ? { extensions } : {}),
    },
    []
  );

  const customBlockExclusions = useMemo(() => {
    return extensions?.map((extension) => extension.name);
  }, [extensions]);

  useEffect(() => {
    if (editor && initialData !== undefined) {
      editor.commands.setContent(initialData);
    }
  }, [editor, initialData]);

  useEffect(() => {
    if (editor) {
      const handleUpdate = ({ editor }) => {
        if (onChange) {
          onChange(editor.getHTML());
        }
      };
      editor.on("update", handleUpdate);
      return () => {
        editor.off("update", handleUpdate);
      };
    }
  }, [editor, onChange]);
  return (
    <ScrollSyncPane>
      <Flex
        flex="1"
        w="full"
        h="full"
        minW="0"
        overflow="visible"
        id="doc-editor-wrapper"
        className={`editor-wrapper${readonly ? " readonly" : ""}`}
      >
        <BlockEditor
          editor={editor}
          theme={colorMode}
          customBlockExclusions={customBlockExclusions}
        >
          {allowComments && editor && (
            <DocumentComments
              editor={editor}
              entityThreadsDisclosure={entityThreadsDisclosure}
            />
          )}
        </BlockEditor>
      </Flex>
    </ScrollSyncPane>
  );
};

export default DocumentEditor;
