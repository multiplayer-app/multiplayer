import { useAgentStore } from "@multiplayer-app/ai-agent-react";

import { usePanelChat } from "../context/panelContext";

/** True when the agent panel is open and a chat session is active (composer can accept attachments). */
export function useCanAttach() {
  const { isOpen } = usePanelChat();
  const activeChatId = useAgentStore((s) => s.activeChatId);
  return isOpen && Boolean(activeChatId);
}
