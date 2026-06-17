export {
  PanelChatProvider,
  usePanelChat,
  usePanelChatOpen,
} from "./context/panelContext";
export { useAgentsPage } from "./context/useAgentsPage";

export { default as ChatPanel } from "./panel/Panel";
export { default as ChatPanelContent } from "./panel/Content";

export {
  SESSION_KIND,
  SPAN_KIND,
  SNAPSHOT_KIND,
  ELEMENT_KIND,
  attachmentIcons,
  useCanAttach,
  useAgentChatAvailable,
  useElementInspectorAvailable,
  AddToChatButton,
  getSessionUrl,
  getSpanName,
  SPAN_ATTACHMENT_SUMMARY,
  simplifySpan,
  buildSpanData,
  buildSpanContext,
  buildSessionContext,
  getSnapshotName,
  SNAPSHOT_ATTACHMENT_SUMMARY,
  buildSnapshotContext,
  ELEMENT_ATTACHMENT_SUMMARY,
  buildElementContext,
  formatElementSelector,
  getElementComputedStyles,
  type SimpleSpan,
  type DebugSessionSnapshotData,
  type DebugSessionElementData,
} from "./attachments";

export { default as SessionPicker } from "./attachments/composer/SessionPicker";
