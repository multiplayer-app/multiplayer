import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";

export function getLanguageByExtension(extension) {
  const languages = monaco.languages.getLanguages();
  const language = languages.find((lang) => {
    return (
      lang.extensions?.some((ext) => ext === `.${extension}`) ||
      lang.aliases?.some((alias) => alias === extension)
    );
  });
  return language ? language.id : "plaintext";
}

export function updateRemoteSelectionStyles(awareness) {
  let styleElement = document.getElementById("yRemoteSelection");
  let combinedStyles = "";

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "yRemoteSelection";
    document.head.appendChild(styleElement);
  }

  awareness.getStates().forEach((state, clientId) => {
    if (!state.user) return;
    const color = state.user.color;
    const username = state.user.username;

    const selectionClassName = `yRemoteSelection-${clientId}`;
    const selectionHeadClassName = `yRemoteSelectionHead-${clientId}`;

    combinedStyles += `
      .${selectionClassName} {
        background-color: ${color}50;
      }
      .${selectionHeadClassName} {
        border-color: ${color};
      }
      .${selectionHeadClassName}::after {
        background-color: ${color};
        content: '${username}';
      }
    `;
  });

  styleElement.innerHTML = combinedStyles;
}

export const getEditorHandlers = (
  editorInstance: editor.IStandaloneCodeEditor
) => ({
  getValue: () => {
    return editorInstance.getValue();
  },
  revealLine: (line: number) => {
    return editorInstance.revealLine(line);
  },
  revealLineInCenter: (line: number) => {
    return editorInstance.revealLineInCenter(line);
  },
  find: () => {
    editorInstance.trigger(null, "actions.find", null);
  },
  canUndo: () => {
    return true; //canUndo;
  },
  canRedo: () => {
    return true; //canRedo;
  },
  undo: () => {
    editorInstance.trigger(null, "undo", null);
  },
  redo: () => {
    editorInstance.trigger(null, "redo", null);
  },
  formatDocument: () => {
    editorInstance.getAction("editor.action.formatDocument").run();
  },
});
