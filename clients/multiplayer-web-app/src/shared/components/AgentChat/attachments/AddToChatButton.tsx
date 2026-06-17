import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { Button, Tooltip, type ButtonProps } from "@chakra-ui/react";
import Icon from "shared/components/Icon";
import {
  createContextAttachment,
  type ContextAttachmentParams,
  useAgentStore,
  useComposerDraft,
} from "@multiplayer-app/ai-agent-react";

import { usePanelChat } from "../context/panelContext";
import { useAgentChatAvailable } from "./useAgentChatAvailable";

type ContextSource =
  | ContextAttachmentParams
  | (() => ContextAttachmentParams | undefined);

interface AddToChatButtonProps extends Omit<ButtonProps, "onClick"> {
  context: ContextSource;
  tooltip: string;
}

function resolveContext(
  source: ContextSource
): ContextAttachmentParams | undefined {
  return typeof source === "function" ? source() : source;
}

const AddToChatButton = ({
  context,
  tooltip,
  ...buttonProps
}: AddToChatButtonProps) => {
  const agentChatAvailable = useAgentChatAvailable();
  const { isOpen, openPanel } = usePanelChat();
  const { addAttachments } = useComposerDraft();
  const activeChatId = useAgentStore((s) => s.activeChatId);
  const pendingContextRef = useRef<ContextSource | null>(null);
  const isChatReady = isOpen && Boolean(activeChatId);

  const flushPendingContext = useCallback(() => {
    const pending = pendingContextRef.current;
    if (!pending) return;

    const params = resolveContext(pending);
    pendingContextRef.current = null;
    if (!params) return;

    addAttachments([createContextAttachment(params)]);
  }, [addAttachments]);

  useEffect(() => {
    if (!isChatReady) return;
    flushPendingContext();
  }, [isChatReady, flushPendingContext]);

  useEffect(() => {
    if (!isOpen) {
      pendingContextRef.current = null;
    }
  }, [isOpen]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (isChatReady) {
      const params = resolveContext(context);
      if (!params) return;
      addAttachments([createContextAttachment(params)]);
      return;
    }

    pendingContextRef.current = context;
    openPanel();
  };

  if (!agentChatAvailable) {
    return null;
  }

  return (
    <Tooltip label={tooltip} openDelay={500}>
      <Button
        size="sm"
        variant="light"
        flexShrink={0}
        onClick={handleClick}
        fontSize="2xs"
        borderRadius="full"
        leftIcon={<Icon name="Bot" boxSize="4" />}
        _hover={{ borderColor: "brand.500" }}
        {...buttonProps}
      >
        Send to agent
      </Button>
    </Tooltip>
  );
};

export default AddToChatButton;
