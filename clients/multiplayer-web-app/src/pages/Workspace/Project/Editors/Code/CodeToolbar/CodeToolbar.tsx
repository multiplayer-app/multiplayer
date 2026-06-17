import { useEffect } from "react";
import Toolbar, {
  ToolbarButton,
  ToolbarButtonGroup,
} from "shared/components/Toolbar";
import {
  RedoIcon,
  UndoIcon,
  SearchCircleIcon,
  BracketsCurlyIcon,
} from "shared/icons";
import { useSource } from "shared/providers/SourceContext";

import { MonacoBinding } from "integrations/YMonaco";
import useYUndoManager from "shared/hooks/useYUndoManager";
import VersionsHistory from "shared/components/VersionsHistory";
import CommentsToggleButton from "shared/components/CommentsToggleButton";
import FullScreenToggleButton from "shared/components/FullScreenToggleButton";
import CommitChangesModal from "../CommitChangesModal";

const CodeToolbar = ({ doc }) => {
  const undoManager = useYUndoManager([doc.getText("text")]);
  const { editorRef, entityThreadsDisclosure } = useSource();

  useEffect(() => {
    undoManager.instance.current.addTrackedOrigin(MonacoBinding);
  }, []);

  return (
    <Toolbar
      middleContent={
        <>
          <CommentsToggleButton disclosure={entityThreadsDisclosure} />
          <ToolbarButton
            icon={<BracketsCurlyIcon />}
            onClick={() => editorRef.current?.formatDocument()}
            label="Format Document"
          />
          <FullScreenToggleButton />
          <CommitChangesModal />
        </>
      }
      rightContent={
        <>
          <ToolbarButtonGroup>
            <ToolbarButton
              icon={<UndoIcon />}
              disabled={!undoManager.canUndo}
              onClick={() => undoManager.undo()}
              label="Undo"
            />
            <ToolbarButton
              icon={<RedoIcon />}
              disabled={!undoManager.canRedo}
              onClick={() => undoManager.redo()}
              label="Redo"
            />
          </ToolbarButtonGroup>
          <ToolbarButton
            icon={<SearchCircleIcon />}
            onClick={() => editorRef.current?.find()}
            label="Search"
          />
          <VersionsHistory />
        </>
      }
    />
  );
};

export default CodeToolbar;
