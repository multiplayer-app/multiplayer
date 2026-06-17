import { useState, useMemo, useEffect, useRef } from "react";
import { ISessionNoteItem, SessionNoteType } from "@multiplayer/types";
import {
  Box,
  Icon,
  Flex,
  HStack,
  Textarea,
  IconButton,
} from "@chakra-ui/react";
import {
  EntitySketchIcon,
  BookmarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "shared/icons";

import NodeContent from "../../DebugSessionDetails/components/DebugSessionNode/NodeContent";
import { SessionNoteNode } from "./types";
import { useDebugSession } from "../../DebugSessionContext";
import { useDebugSessionNotes } from "../../DebugSessionNotesContext";

const SessionNoteCard = ({
  node,
  updateAttributes,
  isSelected,
  isReadOnly,
}: {
  node: SessionNoteNode;
  updateAttributes: (attrs: Partial<SessionNoteNode["attrs"]>) => void;
  isSelected?: boolean;
  isReadOnly?: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);
  const { selectNodeById, setCustomSeekTime } = useDebugSession();
  const { setActiveNote, notes } = useDebugSessionNotes();

  const handleNoteClick = (note: ISessionNoteItem) => {
    let timeOffset = 0;
    switch (note.type) {
      case SessionNoteType.Span:
        selectNodeById(note.id);
        timeOffset = +note.timestamp;
        break;
      case SessionNoteType.Bookmark:
        timeOffset = +note.timestamp;
        break;
      case SessionNoteType.Sketch:
        const time = +note.timestamp;
        const page = Math.max(
          0,
          notes[note.type]
            .filter((n) => +n.timestamp === time)
            .findIndex((n) => n.id === note.id)
        );
        setActiveNote({ id: note.id, timestamp: time, page });
        timeOffset = +note.timestamp;
        break;
    }
    setCustomSeekTime(timeOffset);
  };

  return (
    <Box
      p={1}
      m={-1}
      gap="2"
      border="1px"
      borderRadius="2xl"
      borderColor="transparent"
      {...(isSelected && { boxShadow: "0 0 0 1px blue" })}
      {...(expanded && { borderColor: "border.secondary", bg: "bg.surface" })}
    >
      <NoteCardHeader
        note={node.attrs}
        expanded={expanded}
        onClick={() => handleNoteClick(node.attrs)}
        onToggle={() => setExpanded(!expanded)}
      />
      {expanded && (
        <NoteCardContent
          note={node.attrs}
          isReadOnly={isReadOnly}
          value={node.attrs.note}
          onChange={(value) => updateAttributes({ note: value })}
        />
      )}
    </Box>
  );
};
const NoteCardContent = ({
  note,
  isReadOnly,
  value,
  onChange,
}: {
  note: ISessionNoteItem;
  isReadOnly: boolean;
  value: string;
  onChange: (value: string) => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (textareaRef.current) {
      timeoutRef.current = setTimeout(() => {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          textareaRef.current.scrollHeight + "px";
      }, 200);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  return (
    <Box p={2}>
      <Textarea
        ref={textareaRef}
        resize="none"
        fontSize="inherit"
        overflow="hidden"
        isReadOnly={isReadOnly}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
    </Box>
  );
};

const NoteCardHeader = ({
  note,
  expanded,
  onToggle,
  onClick,
}: // onTitleChange,
{
  note: ISessionNoteItem;
  expanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
  // onTitleChange?: (title: string) => void;
}) => {
  const content = useMemo(() => {
    const metadata = () => {
      try {
        return JSON.parse(note.metadata as unknown as string);
      } catch (error) {
        return null;
      }
    };
    const meta = metadata();

    switch (note.type) {
      case SessionNoteType.Bookmark:
        return (
          <HStack spacing={2}>
            <Icon
              p="1"
              boxSize="6"
              color="inverse"
              bg="blue.300"
              borderRadius="md"
              as={BookmarkIcon}
            />
            <Box fontWeight="medium">{note.title}</Box>
          </HStack>
        );
      case SessionNoteType.Sketch:
        return (
          <HStack spacing={2}>
            <Icon
              p="1"
              boxSize="6"
              color="inverse"
              bg="green.300"
              borderRadius="md"
              as={EntitySketchIcon}
              __css={{ path: { fill: "inverse" } }}
            />
            {/* <Input
              variant="unstyled"
              defaultValue={note.title}
              onChange={(e) => {
                onTitleChange?.(e.target.value);
              }}
            /> */}
            <Box fontWeight="medium">{note.title}</Box>
          </HStack>
        );
      case SessionNoteType.Span:
        return <NodeContent collapsable={false} node={meta} />;
      case SessionNoteType.DomElement:
        return <Flex>DOM Element</Flex>;
      default:
        return null;
    }
  }, [note]);

  return (
    <HStack
      p="2"
      bg="bg.primary"
      border="1px"
      cursor="pointer"
      borderRadius="2xl"
      borderColor="border.secondary"
      onClick={onClick}
    >
      {content}
      <IconButton
        size="sm"
        ml="auto"
        variant="base"
        aria-label="close"
        icon={expanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      />
    </HStack>
  );
};

export default SessionNoteCard;
