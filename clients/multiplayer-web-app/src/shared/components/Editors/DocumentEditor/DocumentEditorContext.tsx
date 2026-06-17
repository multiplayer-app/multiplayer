import { useBlockEditor } from "@multiplayer/blocknote";
import debounce from "lodash.debounce";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiInstance, notebookInstance } from "shared/api";
import useMessage from "shared/hooks/useMessage";
import useNotebookDebugger, {
  UseNotebookDebuggerReturn,
} from "shared/hooks/useNotebookDebugger";
import { PostHogEvents } from "shared/models/enums";
import { IEditorProps } from "shared/models/interfaces";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { UndoManager } from "yjs";
import useSecretsManager from "../../../hooks/useSecretsManager";
import { useVersion } from "shared/providers/VersionContext";

interface IDocumentEditorContext extends IEditorProps<any> {
  editor?: any;
  readonly?: boolean;
  notebookDebugger?: UseNotebookDebuggerReturn;
  isNotebookAreaExpanded?: boolean;
  setIsNotebookAreaExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface IDocumentEditorProviderProps extends IEditorProps<any> {
  children: React.ReactNode | undefined;
  readonly?: boolean;
  fieldName?: string;
  markdown?: boolean;
  undoManager?: UndoManager;
  allowRunnableBlocks?: boolean;
}

const DocumentEditorContext = createContext<IDocumentEditorContext>(null);

export const DocumentEditorProvider = ({
  doc,
  markdown,
  provider,
  readonly,
  children,
  undoManager,
  initialData,
  allowComments,
  allowRunnableBlocks,
  fieldName = "xml",
  onChange,
}: IDocumentEditorProviderProps) => {
  const message = useMessage();
  const { user } = useWorkspace();
  const { trackEvent } = useAnalytics();
  const { currentBranchId } = useVersion();
  const secretsManager = useSecretsManager();
  const notebookDebugger = useNotebookDebugger();
  const { path, workspaceId, projectId } = useParams();
  const [isNotebookAreaExpanded, setIsNotebookAreaExpanded] = useState(false);
  const basePath = `/workspaces/${workspaceId}/projects/${projectId}`;
  const editor = useBlockEditor(
    {
      allowComments,
      autofocus: false,
      editable: !readonly,
      allowRunnableBlocks,
      user: {
        id: user?.data?._id,
        color: user?.data?.color,
        name: user?.data?.username,
      },
      showOutline: !!localStorage.getItem(`${path}Outline`),
      environments: doc.getMap("environments"),
      proxy: { apiInstance: notebookInstance, path: `${basePath}/proxy` },
      aiAssistant: {
        apiInstance: apiInstance,
        path: `${basePath}/branches/${currentBranchId}/assistant/generate`,
      },
      secretsManager: secretsManager?.instance,
      notebookDebugger: notebookDebugger?.instance,
      onContentError: ({ error }) => message.handleError(error),
      ...(doc && provider
        ? {
            collaboration: {
              provider,
              undoManager,
              fragment: doc.getXmlFragment(fieldName),
            },
          }
        : {}),
    },
    [path, workspaceId, projectId]
  );

  useEffect(() => {
    if (editor && initialData !== undefined) {
      editor.commands.setContent(initialData);
    }
  }, [editor, markdown, initialData]);

  useEffect(() => {
    if (editor) {
      const handleUpdate = ({ editor }) => {
        debounce(() => {
          trackEvent(PostHogEvents.UPDATE_NOTEBOOK, {
            notebookId: path,
          });
        }, 500);
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
    <DocumentEditorContext.Provider
      value={{
        editor,
        readonly,
        notebookDebugger,
        allowComments,
        isNotebookAreaExpanded,
        setIsNotebookAreaExpanded,
      }}
    >
      {children}
    </DocumentEditorContext.Provider>
  );
};

export function useDocumentEditor() {
  const context = useContext(DocumentEditorContext);
  if (context === null) {
    console.error(
      new Error("useDocumentEditor must be used within DocumentEditorProvider")
    );
    return {};
  }
  return context;
}
