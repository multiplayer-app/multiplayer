import { Icon, UseDisclosureReturn } from "@chakra-ui/react";
import {
  RedoIcon,
  UndoIcon,
  VariableIcon,
  SidebarIcon,
  ExpandIcon,
} from "shared/icons";
import Toolbar, {
  ToolbarButton,
  ToolbarButtonGroup,
} from "shared/components/Toolbar";
import VersionsHistory from "shared/components/VersionsHistory";
import { UseUndoManagerReturn } from "shared/hooks/useYUndoManager";
import CommentsToggleButton from "shared/components/CommentsToggleButton";
import FullScreenToggleButton from "shared/components/FullScreenToggleButton";
import DocumentRunButton from "../DocumentRunButton";
import DocumentOutlineButton from "../DocumentOutlineButton";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { useDocumentEditor } from "shared/components/Editors/DocumentEditor/DocumentEditorContext";
import Visibility from "shared/components/Visibility";

interface DocumentToolbarProps {
  readonly: boolean;
  undoManager: UseUndoManagerReturn;
  entityThreadsDisclosure: UseDisclosureReturn;
  propertiesDrawerDisclosure: UseDisclosureReturn;
  documentVariablesDisclosure: UseDisclosureReturn;
}

const DocumentToolbar = ({
  readonly,
  undoManager,
  entityThreadsDisclosure,
  propertiesDrawerDisclosure,
  documentVariablesDisclosure,
}: DocumentToolbarProps) => {
  const { isSandbox } = useProjectSandbox();
  const { isNotebookAreaExpanded, setIsNotebookAreaExpanded } =
    useDocumentEditor();

  return (
    <Toolbar
      leftContent={
        <Visibility hideBelow="md">
          <DocumentOutlineButton />
        </Visibility>
      }
      middleContent={
        <>
          <ToolbarButton
            icon={<SidebarIcon />}
            onClick={propertiesDrawerDisclosure.onToggle}
            isActive={propertiesDrawerDisclosure.isOpen}
            label={
              propertiesDrawerDisclosure.isOpen
                ? "Close Notebook Information"
                : "Open Notebook Information"
            }
          />

          <CommentsToggleButton
            disclosure={entityThreadsDisclosure}
            enforceSandboxCheck={isSandbox}
          />
          <FullScreenToggleButton />
          <ToolbarButton
            label="Variables"
            icon={<Icon as={VariableIcon} />}
            onClick={documentVariablesDisclosure.onToggle}
            isActive={documentVariablesDisclosure.isOpen}
          />
          <ToolbarButton
            label="Expand Notebook Area"
            icon={<Icon as={ExpandIcon} transform={`rotate(90deg)`} />}
            onClick={() => setIsNotebookAreaExpanded(!isNotebookAreaExpanded)}
            isActive={isNotebookAreaExpanded}
          />
          <Visibility hideBelow="md">
            <DocumentRunButton />
          </Visibility>
        </>
      }
      rightContent={
        !readonly && (
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
            <VersionsHistory />
          </>
        )
      }
    />
  );
};

export default DocumentToolbar;
