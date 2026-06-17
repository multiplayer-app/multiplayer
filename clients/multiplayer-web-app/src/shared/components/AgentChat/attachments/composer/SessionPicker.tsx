import {
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
} from "@chakra-ui/react";
import {
  ComposerAttachmentActionsProps,
  createContextAttachment,
} from "@multiplayer-app/ai-agent-react";
import { useParams } from "react-router-dom";

import Icon from "shared/components/Icon";
import IconButton from "shared/components/IconButton";

import { buildSessionContext } from "../debugSession/sessionContext";
import { useSessionList } from "./useSessionList";

const SessionPicker = ({ addAttachments }: ComposerAttachmentActionsProps) => {
  const { workspaceId, projectId } = useParams();
  const {
    sessions,
    loadingInitial,
    loadingMore,
    loaded,
    hasMore,
    fetchInitialSessions,
    fetchMoreSessions,
  } = useSessionList();

  const handleMenuOpen = () => {
    if (!loaded && !loadingInitial) {
      fetchInitialSessions();
    }
  };

  const handleAttach = (sessionId: string, sessionName?: string) => {
    addAttachments([
      createContextAttachment(
        buildSessionContext({
          sessionId,
          name: sessionName,
          workspaceId,
          projectId,
        })
      ),
    ]);
  };

  return (
    <Menu onOpen={handleMenuOpen}>
      <MenuButton as="span">
        <IconButton
          variant="ghost"
          size="xs"
          color="muted"
          icon={<Icon name="SquarePlay" strokeWidth="1.5" boxSize="5" />}
          label="File"
          _hover={{
            color: "body",
            bg: "node",
          }}
        />
      </MenuButton>
      <Portal>
        <MenuList minW="8" maxH="240px" overflow="auto" zIndex="popover">
          {loadingInitial && (
            <MenuItem isDisabled>Loading debug sessions...</MenuItem>
          )}
          {!loadingInitial && sessions.length === 0 && (
            <MenuItem isDisabled>No debug sessions found</MenuItem>
          )}
          {!loadingInitial &&
            sessions.map((session) => (
              <MenuItem
                key={session._id}
                gap="2"
                maxW="300px"
                onClick={() => handleAttach(session._id, session.name)}
              >
                <Icon name="SquarePlay" strokeWidth="1.5" boxSize="5" />
                <Text noOfLines={1}>{session.name}</Text>
              </MenuItem>
            ))}
          {!loadingInitial && hasMore && (
            <MenuItem isDisabled={loadingMore} onClick={fetchMoreSessions}>
              {loadingMore ? "Loading more..." : "Load more"}
            </MenuItem>
          )}
        </MenuList>
      </Portal>
    </Menu>
  );
};

export default SessionPicker;
