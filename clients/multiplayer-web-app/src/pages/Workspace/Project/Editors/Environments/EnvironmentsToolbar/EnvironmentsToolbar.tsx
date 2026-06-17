import { UseDisclosureReturn } from "@chakra-ui/react";
import { UndoIcon, RedoIcon } from "shared/icons";

import Toolbar, {
  ToolbarButton,
  ToolbarButtonGroup,
} from "shared/components/Toolbar";
import { UseUndoManagerReturn } from "shared/hooks/useYUndoManager";
import VersionsHistory from "shared/components/VersionsHistory";
import FullScreenToggleButton from "shared/components/FullScreenToggleButton";
import CommentsToggleButton from "shared/components/CommentsToggleButton";

interface EnvironmentsToolbarProps {
  entityThreadsDisclosure: UseDisclosureReturn;
  undoManager: UseUndoManagerReturn;
  readonly: boolean;
}

const EnvironmentsToolbar = ({
  entityThreadsDisclosure,
  undoManager,
  readonly,
}: EnvironmentsToolbarProps) => {
  return (
    <Toolbar
      bg="bg.primary"
      h="16"
      pr="4"
      middleContent={
        readonly ? null : (
          <>
            <CommentsToggleButton disclosure={entityThreadsDisclosure} />
            <FullScreenToggleButton />
          </>
        )
      }
      rightContent={
        readonly ? null : (
          <>
            <ToolbarButtonGroup>
              <ToolbarButton
                icon={<UndoIcon />}
                disabled={!undoManager.canUndo}
                onClick={undoManager.undo}
                label="Undo"
              />

              <ToolbarButton
                icon={<RedoIcon />}
                disabled={!undoManager.canRedo}
                onClick={undoManager.redo}
                label="Redo"
              />
            </ToolbarButtonGroup>
            <VersionsHistory />
          </>
        )
      }
    />
  );
};

export default EnvironmentsToolbar;
