import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Icon } from "@chakra-ui/react";
import { BookmarkIcon } from "shared/icons";
import { SessionNoteType } from "@multiplayer/types";
import { ToolbarButton } from "shared/components/Toolbar";
import { formatTime } from "../../../../utils";
import { useDebugSessionNotes } from "../../../../DebugSessionNotesContext";
import { useReplayerOverlay } from "../ReplayerOverlayContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

const BookmarkButton = () => {
  const { withSandboxCheck } = useProjectSandbox();
  const { currentTime } = useReplayerOverlay();
  const {
    addSessionNote,
    deleteSessionNote,
    notes: { [SessionNoteType.Bookmark]: notes },
  } = useDebugSessionNotes();

  const currentTimeNotes = useMemo(
    () => notes.filter((note) => note.timestamp === currentTime),
    [notes, currentTime]
  );

  const onToggleBookmark = () => {
    if (currentTimeNotes.length) {
      deleteSessionNote(currentTimeNotes[0].id);
    } else {
      addSessionNote({
        id: uuidv4(),
        note: "",
        timestamp: currentTime,
        type: SessionNoteType.Bookmark,
        title: `Note at ${formatTime(currentTime)}`,
      });
    }
  };
  const isActive = !!currentTimeNotes.length;
  return (
    <ToolbarButton
      isActive={isActive}
      label={isActive ? "Remove note" : "Add note"}
      icon={<Icon as={BookmarkIcon} />}
      onClick={withSandboxCheck(onToggleBookmark)}
    />
  );
};

export default BookmarkButton;
