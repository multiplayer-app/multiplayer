import { Button, Icon } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useState } from "react";

import { useDocumentEditor } from "shared/components/Editors/DocumentEditor/DocumentEditorContext";
import useMessage from "shared/hooks/useMessage";
import { DebugIcon } from "shared/icons";

interface DocumentDebuggerToggleProps {
  isDisabled?: boolean;
}

const DocumentDebuggerToggle = (props: DocumentDebuggerToggleProps) => {
  const message = useMessage();
  const { notebookDebugger } = useDocumentEditor();
  const [loading, setLoading] = useState(false);
  const { instance, running, startSession, stopSession } = notebookDebugger;

  if (!instance) return null;
  const toggleSession = async () => {
    setLoading(true);
    try {
      if (running) {
        await stopSession();
      } else {
        await startSession();
      }
    } catch (error) {
      message.handleError(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button
      size="sm"
      variant="light"
      borderRadius="lg"
      onClick={toggleSession}
      isLoading={loading}
      isDisabled={props.isDisabled}
      leftIcon={
        running ? <RecordingIcon boxSize="5" /> : <Icon as={DebugIcon} />
      }
    >
      {running ? "Stop Recording" : "Start Recording"}
    </Button>
  );
};

const bounceAnimation = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
`;

const RecordingIcon = (props) => (
  <Icon
    viewBox="0 0 20 20"
    fill="none"
    animation={`${bounceAnimation} 1s infinite`}
    {...props}
  >
    <circle cx="10" cy="10" r="2" fill="#E53E3E" />
    <circle cx="10" cy="10" r="6" stroke="#E53E3E" />
    <circle opacity="0.2" cx="10" cy="10" r="8" stroke="#E53E3E" />
  </Icon>
);

export default DocumentDebuggerToggle;
