import { v4 as uuidv4 } from "uuid";
import { mergeAttributes, Node, NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

import { SessionNoteNode } from "./types";
import SessionNoteCard from "./DebugSessionNodeCard";
import { SessionNoteType } from "@multiplayer/types";

export const SESSION_NOTE_BLOCK = "session-note-block";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [SESSION_NOTE_BLOCK]: {};
  }
}
export interface NoteBlockOptions {}

const NoteBlockContent = (props: NodeViewProps) => {
  const { node, updateAttributes, editor } = props;
  const sessionNoteNode = node as SessionNoteNode;

  const isSelected = editor.isActive(SESSION_NOTE_BLOCK, {
    id: node.attrs.id,
  });
  const readOnly = !editor.isEditable;
  return (
    <NodeViewWrapper>
      <SessionNoteCard
        isReadOnly={readOnly}
        node={sessionNoteNode}
        isSelected={isSelected}
        updateAttributes={updateAttributes}
      />
    </NodeViewWrapper>
  );
};

export const SessionNoteBlockExtension = Node.create<NoteBlockOptions>({
  name: SESSION_NOTE_BLOCK,
  group: "block",
  atom: true,
  inline: false,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      id: {
        default: () => uuidv4(),
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => ({ id: attributes.id }),
      },
      type: {
        default: SessionNoteType.Sketch,
        parseHTML: (element) => element.getAttribute("data-type"),
        renderHTML: (attributes) => ({ type: attributes.type }),
      },
      title: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => ({ title: attributes.title }),
      },
      note: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-note"),
        renderHTML: (attributes) => ({ note: attributes.note }),
      },
      timestamp: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-timestamp"),
        renderHTML: (attributes) => ({ timestamp: attributes.timestamp }),
      },
      metadata: {
        default: null,
        parseHTML: (element) => {
          const metadataAttr = element.getAttribute("data-metadata");
          if (metadataAttr) {
            try {
              return JSON.parse(metadataAttr);
            } catch {
              return null;
            }
          }
          return null;
        },
        renderHTML: (attributes) => ({ "data-metadata": attributes.metadata }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[data-block="${SESSION_NOTE_BLOCK}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-block": SESSION_NOTE_BLOCK }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteBlockContent);
  },

  addCommands() {
    return {};
  },

  addKeyboardShortcuts() {
    return {};
  },

  addProseMirrorPlugins() {
    return [];
  },
});
