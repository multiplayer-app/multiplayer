import { UseDisclosureReturn } from "@chakra-ui/react";
import { UseUndoManagerReturn } from "shared/hooks/useYUndoManager";
import Toolbar, {
  ToolbarButton,
  ToolbarButtonGroup,
} from "shared/components/Toolbar";
import CommentsToggleButton from "shared/components/CommentsToggleButton";
import FullScreenToggleButton from "shared/components/FullScreenToggleButton";
import VersionsHistory from "shared/components/VersionsHistory";
import { useVersion } from "shared/providers/VersionContext";
import { DocChangesHighlightIcon, RedoIcon, UndoIcon } from "shared/icons";

interface VariablesGroupToolbarProps {
  entityThreadsDisclosure: UseDisclosureReturn;
  undoManager: UseUndoManagerReturn;
  readonly: boolean;
  setShowChanges?: (value: boolean) => void;
  showChanges?: boolean;
}

const VariablesGroupToolbar = ({
  entityThreadsDisclosure,
  undoManager,
  readonly,
  setShowChanges,
  showChanges,
}: VariablesGroupToolbarProps) => {
  const { currentBranch } = useVersion();

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
            {!currentBranch.data.default && (
              <ToolbarButton
                color={showChanges ? "brand.500" : "muted"}
                icon={<DocChangesHighlightIcon />}
                label="Show Changes"
                onClick={() => {
                  setShowChanges(!showChanges);
                }}
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

export default VariablesGroupToolbar;
