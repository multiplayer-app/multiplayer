import { ChevronDownIcon, AddIcon } from "@chakra-ui/icons";
import {
  Menu,
  ButtonGroup,
  Button,
  MenuButton,
  IconButton,
  Icon,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { StarsIcon } from "shared/icons";

import CountBadge from "../CountBadge";
import { useVsCode } from "vscode/VsCodeContext";

interface AddToChatProps {
  count?: number;
  onAddToChat: (assistantId?: string) => void;
}
interface Assistant {
  name: string;
  id: string;
  isDefault: boolean;
}
const AddToChat = ({ count, onAddToChat }: AddToChatProps) => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const { sendMessage } = useVsCode();

  useEffect(() => {
    const handleGetSessionContext = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "getAvailableAssistantsResponse":
          setAssistants(message.assistants);
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", handleGetSessionContext);
    sendMessage({ type: "getAvailableAssistants" });
    return () => {
      window.removeEventListener("message", handleGetSessionContext);
    };
  }, [sendMessage]);

  const handleAddToChat = (assistantId?: string) => {
    if (assistants.length === 0) return;

    const defaultAssistant = assistants.find(
      (assistant) => assistant.isDefault
    );
    if (defaultAssistant) {
      onAddToChat();
    } else {
      onAddToChat(assistants[0].id);
    }
  };

  return (
    <Menu>
      <ButtonGroup size="sm">
        <Button
          leftIcon={<StarsIcon />}
          position="relative"
          onClick={() => handleAddToChat()}
          disabled={assistants.length === 0}
          borderRightRadius={assistants.length > 1 ? "0" : undefined}
        >
          <CountBadge value={count} position="top-left" />
          Add to chat
        </Button>
        {assistants.length > 1 && (
          <MenuButton
            ml="0!"
            as={IconButton}
            borderLeftRadius="0"
            icon={<Icon as={ChevronDownIcon} />}
          >
            <IconButton aria-label="Add to assistant" icon={<AddIcon />} />
          </MenuButton>
        )}
      </ButtonGroup>
      <MenuList zIndex="popover">
        {assistants
          .filter((assistant) => !assistant.isDefault)
          .map((assistant) => (
            <MenuItem
              key={assistant.id}
              onClick={() => onAddToChat(assistant.id)}
            >
              Add to {assistant.name}
            </MenuItem>
          ))}
      </MenuList>
    </Menu>
  );
};

export default AddToChat;
