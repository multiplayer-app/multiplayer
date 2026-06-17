import { IS_VSCODE } from "vscode/VsCodeContext";

import { useAgentChatAvailable } from "./useAgentChatAvailable";

/** Web: agents feature + workers. VS Code: legacy fixSession inspector (no agents required). */
export function useElementInspectorAvailable() {
  const agentChatAvailable = useAgentChatAvailable();
  return agentChatAvailable || IS_VSCODE;
}
