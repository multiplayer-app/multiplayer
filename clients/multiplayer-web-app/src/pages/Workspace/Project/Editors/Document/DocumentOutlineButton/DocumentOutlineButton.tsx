import { Button, Icon } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useDocumentEditor } from "shared/components/Editors/DocumentEditor/DocumentEditorContext";
import { OutlineIcon } from "shared/icons";

interface DocumentOutlineButtonProps {}

const DocumentOutlineButton = (props: DocumentOutlineButtonProps) => {
  const { path } = useParams();
  const { editor } = useDocumentEditor();

  const onToggle = () => {
    const newValue = !editor.storage.tableOfContents.showOutline;
    if (newValue) {
      localStorage.setItem(`${path}Outline`, "true");
    } else {
      localStorage.removeItem(`${path}Outline`);
    }
    editor.commands.toggleOutline(newValue);
  };

  return (
    <Button
      variant="light"
      borderRadius="full"
      leftIcon={<Icon as={OutlineIcon} />}
      onClick={onToggle}
    >
      Outline
    </Button>
  );
};

export default DocumentOutlineButton;
