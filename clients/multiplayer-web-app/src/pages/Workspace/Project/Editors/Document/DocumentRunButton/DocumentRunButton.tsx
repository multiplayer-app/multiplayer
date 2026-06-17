import { Icon, Button, Spinner } from "@chakra-ui/react";
import debounce from "lodash.debounce";
import { useState, useEffect } from "react";
import { getRunnableBlocks } from "@multiplayer/blocknote";

import { BroomIcon, PlayCircleIcon } from "shared/icons";
import useMessage from "shared/hooks/useMessage";
import { useDocumentEditor } from "shared/components/Editors/DocumentEditor/DocumentEditorContext";
import { ToolbarButton } from "shared/components/Toolbar";
import DocumentDebuggerToggle from "../DocumentDebuggerToggle";
import {
  RoleType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import CheckAccess from "shared/components/CheckAccess";

interface DocumentRunButtonProps {}

const DocumentRunButton = (props: DocumentRunButtonProps) => {
  const message = useMessage();
  const [running, setRunning] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const { editor } = useDocumentEditor();

  const handleClear = () => {
    editor.commands.clearAllBlocks();
  };

  const handleCancel = () => {
    editor.commands.cancelAllBlocks();
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      await editor.commands.runAllBlocks();
    } catch (error) {
      message.handleError(error);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (editor) {
      const onUpdate = debounce(() => {
        const blocks = getRunnableBlocks(editor.state);
        setShowButton(!!blocks.length);
      }, 500);
      editor.on("update", onUpdate);
      return () => {
        editor.off("update", onUpdate);
      };
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <>
      <ToolbarButton
        label="Clear results"
        onClick={handleClear}
        icon={<Icon as={BroomIcon} />}
      />

      <Button
        size="sm"
        variant="light"
        borderRadius="lg"
        isDisabled={!showButton}
        onClick={() => (running ? handleCancel() : handleRun())}
        leftIcon={
          running ? (
            <Spinner boxSize="4" color="brand.500" />
          ) : (
            <Icon as={PlayCircleIcon} color="green.400" />
          )
        }
      >
        {running ? "Stop" : "Run All"}
      </Button>
      <CheckAccess
        scope={RoleType.PROJECT}
        permission={RoleAccessAction.READ}
        entity={RoleProjectPermissionEntity.PROXY}
      >
        <DocumentDebuggerToggle isDisabled={!showButton} />
      </CheckAccess>
    </>
  );
};

export default DocumentRunButton;
