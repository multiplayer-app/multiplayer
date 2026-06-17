import { useEffect, useMemo } from "react";
import { useDebugSession } from "../DebugSessionContext";
import { useDebugSessionNotes } from "../DebugSessionNotesContext";
import AddToChat from "shared/components/AddToChat";
import { useVsCode } from "vscode/VsCodeContext";
// import { getSessionNotesContent } from "shared/services/assets.service";

const FixWithAIAssistantButton = () => {
  const { notes } = useDebugSessionNotes();
  const { session, sessionNodes, checkedNodes } = useDebugSession();
  const { fixSession, sendMessage } = useVsCode();

  useEffect(() => {
    const handleGetSessionContext = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "getSessionContext":
          sendMessage({
            type: "getSessionContextResponse",
            context: { notes, session, sessionNodes, checkedNodes },
          });
          break;
      }
    };

    window.addEventListener("message", handleGetSessionContext);
    return () => {
      window.removeEventListener("message", handleGetSessionContext);
    };
  }, [sessionNodes, checkedNodes, notes, session, sendMessage]);

  const count = useMemo(() => {
    return Array.from(checkedNodes.values()).filter(Boolean).length;
  }, [checkedNodes]);

  const handleFixSession = async (assistantId?: string) => {
    const context = {
      notes,
      session,
      sessionNodes,
      checkedNodes,
    };
    fixSession(session._id, context, assistantId);
  };

  return <AddToChat count={count} onAddToChat={handleFixSession} />;
};

export default FixWithAIAssistantButton;
