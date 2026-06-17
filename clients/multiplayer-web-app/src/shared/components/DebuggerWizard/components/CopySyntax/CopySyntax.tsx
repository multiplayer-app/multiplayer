import { Icon, Tooltip } from "@chakra-ui/react";
import { ClipboardCopyIcon } from "shared/icons";
import useMessage from "shared/hooks/useMessage";

const CopySyntax = ({ value, props = {} }) => {
  const message = useMessage();

  const onCopySyntax = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(value);
      message.success("Successfully copied!");
    } catch (error) {
      message.handleError({ message: "Something went wrong!" });
    }
  };
  return (
    <Tooltip label="Copy">
      <Icon
        cursor="pointer"
        position="absolute"
        top="14px"
        right="10px"
        color="muted"
        backgroundColor="bg.primary"
        borderRadius={5}
        boxSize={4}
        onClick={onCopySyntax}
        verticalAlign="text-top"
        as={ClipboardCopyIcon}
        {...props}
      />
    </Tooltip>
  );
};

export default CopySyntax;
