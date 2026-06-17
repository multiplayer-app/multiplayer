import { UseDisclosureReturn } from "@chakra-ui/react";
import { UndoIcon, RedoIcon, DocChangesHighlightIcon } from "shared/icons";

import Toolbar, {
  ToolbarButton,
  ToolbarButtonGroup,
} from "shared/components/Toolbar";
import { useVersion } from "shared/providers/VersionContext";
import VersionsHistory from "shared/components/VersionsHistory";
import { UseUndoManagerReturn } from "shared/hooks/useYUndoManager";
import CommentsToggleButton from "shared/components/CommentsToggleButton";
import FullScreenToggleButton from "shared/components/FullScreenToggleButton";

interface PlatformComponentToolbarProps {
  setShowChanges?: (value: boolean) => void;
  showChanges?: boolean;
  readonly: boolean;
  undoManager: UseUndoManagerReturn;
  entityThreadsDisclosure: UseDisclosureReturn;
}

const PlatformComponentToolbar = ({
  setShowChanges,
  showChanges,
  undoManager,
  readonly,
  entityThreadsDisclosure,
}: PlatformComponentToolbarProps) => {
  const { currentBranch } = useVersion();

  return (
    <Toolbar
      zIndex="1"
      h="16"
      pr="4"
      bg="bg.primary"
      middleContent={
        readonly ? null : (
          <>
            <CommentsToggleButton disclosure={entityThreadsDisclosure} />
            <FullScreenToggleButton />
            {!currentBranch.data.default && (
              <ToolbarButton
                color={showChanges ? "brand.500" : "muted"}
                icon={<DocChangesHighlightIcon />}
                label="Show Changes"
                onClick={() => setShowChanges(!showChanges)}
              />
            )}
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

export default PlatformComponentToolbar;
