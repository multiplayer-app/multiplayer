import {
  useState,
  useEffect,
  ReactNode,
  useContext,
  createContext,
  useCallback,
  useRef,
} from "react";
import { useParams } from "react-router-dom";

import { useSessionNoteState } from "shared/hooks/useSessionNoteState";
import { DebugSessionNoteState } from "shared/models/interfaces";
import { ISessionNoteItem, SessionNoteType } from "@multiplayer/types";
import { SessionNotesHelper } from "@multiplayer/entity";
import { clone } from "shared/utils";
interface IActiveNote {
  id: string;
  timestamp: number;
  page: number;
}
interface ISessionNotesContext {
  state: DebugSessionNoteState;
  notes: Record<SessionNoteType, ISessionNoteItem[]>;
  activeNote: React.MutableRefObject<IActiveNote>;
  setActiveNote: (note: IActiveNote) => void;
  addSessionNote: (noteData: ISessionNoteItem) => void;
  updateSessionNote: (
    noteId: string,
    updates: Partial<ISessionNoteItem>
  ) => boolean;
  deleteSessionNote: (noteId: string) => boolean;
  findSessionNote: (noteId: string) => ISessionNoteItem | null;
  getAllSessionNotes: () => Array<ISessionNoteItem>;
}

const initialNotes: ISessionNotesContext["notes"] = {
  [SessionNoteType.Span]: [],
  [SessionNoteType.Sketch]: [],
  [SessionNoteType.Bookmark]: [],
  [SessionNoteType.DomElement]: [],
};

const DebugSessionNotesContext = createContext<ISessionNotesContext | null>(
  null
);

const DebugSessionNotesProvider = ({
  children,
  sessionId,
}: {
  children: ReactNode;
  sessionId: string;
}) => {
  const { workspaceId, projectId } = useParams();
  const activeNote = useRef<IActiveNote | null>(null);

  const [notes, setNotes] =
    useState<ISessionNotesContext["notes"]>(initialNotes);
  const state = useSessionNoteState(workspaceId, projectId, sessionId);

  const addSessionNote = (noteData: ISessionNoteItem) => {
    if (!state.doc) return;

    const xml = state.doc.getXmlFragment("xml");
    SessionNotesHelper.addSessionNoteBlock(xml, noteData);
  };

  const updateSessionNote = (
    noteId: string,
    updates: Partial<ISessionNoteItem>
  ) => {
    if (!state.doc) return false;

    const xml = state.doc.getXmlFragment("xml");
    return SessionNotesHelper.updateSessionNoteBlock(xml, noteId, updates);
  };

  const deleteSessionNote = (noteId: string) => {
    if (!state.doc) return false;

    const xml = state.doc.getXmlFragment("xml");
    return SessionNotesHelper.deleteSessionNoteBlock(xml, noteId);
  };

  const findSessionNote = (noteId: string): ISessionNoteItem | null => {
    if (!state.doc) return null;

    const xml = state.doc.getXmlFragment("xml");
    const element = SessionNotesHelper.findSessionNoteBlock(xml, noteId);

    if (!element) return null;

    // Extract attributes from the element
    const id = element.getAttribute("data-id");
    const type = element.getAttribute("data-type");
    const title = element.getAttribute("data-title");
    const note = element.getAttribute("data-note");
    const timestamp = element.getAttribute("data-timestamp");
    const metadataStr = element.getAttribute("data-metadata");

    let metadata: Record<string, any> | undefined;
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (e) {
        console.warn("Failed to parse metadata for note:", id);
      }
    }

    return {
      id,
      note,
      title,
      metadata,
      type: type as SessionNoteType,
      timestamp: Number(timestamp),
    };
  };

  const getAllSessionNotes = useCallback((): Array<ISessionNoteItem> => {
    if (!state.doc) return [];
    const xml = state.doc.getXmlFragment("xml");
    return SessionNotesHelper.getAllSessionNoteBlocks(xml);
  }, [state.doc]);

  useEffect(() => {
    if (state.doc) {
      const xml = state.doc.getXmlFragment("xml");
      const setGroupedNotes = () => {
        const allNotes = SessionNotesHelper.getAllSessionNoteBlocks(xml);
        setNotes((prev) => {
          const newNotes = getGroupedNotes(allNotes);
          if (JSON.stringify(prev) === JSON.stringify(newNotes)) return prev;
          return newNotes;
        });
      };

      xml.observeDeep((events) => {
        if (events.some((e) => e.target.nodeName === "session-note-block")) {
          setGroupedNotes();
        }
      });
      xml.observe((events) => {
        setGroupedNotes();
      });
      setGroupedNotes();
    }
  }, [state.doc]);

  const setActiveNote = useCallback((note: IActiveNote) => {
    activeNote.current = note;
  }, []);

  return (
    <DebugSessionNotesContext.Provider
      value={{
        // State
        state,
        notes,
        activeNote,
        setActiveNote,
        addSessionNote,
        updateSessionNote,
        deleteSessionNote,
        findSessionNote,
        getAllSessionNotes,
      }}
    >
      {children}
    </DebugSessionNotesContext.Provider>
  );
};

export function useDebugSessionNotes() {
  const context = useContext(DebugSessionNotesContext);
  if (context === null) {
    throw new Error(
      "useDebugSessionNotes must be used within DebugSessionNotesProvider"
    );
  }
  return context;
}

const getGroupedNotes = (notes: ISessionNoteItem[]) => {
  const newNotes = clone(initialNotes);
  notes.forEach((note) => {
    newNotes[note.type].push(note);
  });
  return newNotes;
};

export { DebugSessionNotesProvider };
