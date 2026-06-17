import { Collapse, Icon, Textarea, Box } from "@chakra-ui/react";
import IconButton from "shared/components/IconButton";
import { CopilotIcon, CopilotOIcon } from "shared/icons";
import { useState, useEffect, useMemo } from "react";

import { SessionNoteType } from "@multiplayer/types";
import { useDebugSession } from "../../../../DebugSessionContext";
import { useDebugSessionNotes } from "../../../../DebugSessionNotesContext";
import { DebugSessionNodeType, IDebugSessionNode } from "../../../../types";

interface NodeNoteProps {
  minW?: string;
  expanded: boolean;
  readonly: boolean;
  node: IDebugSessionNode<DebugSessionNodeType>;
}

const NodeNote = ({ node, expanded, minW, readonly }: NodeNoteProps) => {
  const { sessionTime } = useDebugSession();
  const { notes, addSessionNote, updateSessionNote } = useDebugSessionNotes();
  const note = useMemo(
    () => notes[SessionNoteType.Span].find((note) => note.id === node.id),
    [notes, node.id]
  );
  const [originalValue, setOriginalValue] = useState(note?.note || "");
  const [currentValue, setCurrentValue] = useState(note?.note || "");

  useEffect(() => {
    setOriginalValue(note?.note || "");
    setCurrentValue(note?.note || "");
  }, [note?.note]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readonly) return;
    setCurrentValue(e.target.value);
  };

  const handleSave = () => {
    if (readonly) return;
    // Only save if the value has actually changed
    if (currentValue !== originalValue) {
      const { type, meta, timestamp, id } = node;
      if (note) {
        updateSessionNote(id, { note: currentValue });
      } else {
        addSessionNote({
          id,
          note: currentValue,
          metadata: { meta, type },
          type: SessionNoteType.Span,
          timestamp: Math.floor((timestamp - sessionTime.start) / 1000) * 1000,
        });
      }
      // Update the original value after saving
      setOriginalValue(currentValue);
    }
  };

  return (
    <Box as={Collapse} in={expanded} unmountOnExit={true} minW={minW}>
      <Box bg="bg.surface" px="2" pt="1" pb="2">
        <Textarea
          rows={2}
          resize="none"
          autoFocus
          border="none"
          fontSize="inherit"
          isReadOnly={readonly}
          value={currentValue}
          placeholder="Write note..."
          onChange={handleChange}
          onBlur={handleSave}
        />
      </Box>
    </Box>
  );
};

export const NodeNoteToggleButton = ({
  node,
  expanded,
  onToggle,
}: {
  expanded: boolean;
  node: IDebugSessionNode<DebugSessionNodeType>;
  onToggle: () => void;
}) => {
  const { notes } = useDebugSessionNotes();
  const isActive = notes[SessionNoteType.Span].some(
    (note) => note.id === node.id
  );
  const icon = isActive ? CopilotIcon : CopilotOIcon;
  const color = isActive || expanded ? "brand.500" : "muted";

  return (
    <IconButton
      p="0"
      py="1"
      h="auto"
      size="xs"
      label="Note"
      variant="base"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      icon={<Icon color={color} as={icon} />}
    />
  );
};

export default NodeNote;
