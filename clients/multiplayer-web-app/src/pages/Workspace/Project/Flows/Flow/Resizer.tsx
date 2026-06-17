import { Box } from "@chakra-ui/react";
import { useFlowLayout } from "./FlowLayoutContext";

export const ResizeHandle = () => {
  const { handleResize } = useFlowLayout();

  const handleMouseMove = ({ movementY }) => {
    handleResize(movementY);
  };

  const handleMouseDown = (event) => {
    const handleMouseUp = () => {
      document.removeEventListener("pointermove", handleMouseMove);
      document.removeEventListener("pointerup", handleMouseUp);
    };

    document.addEventListener("pointermove", handleMouseMove);
    document.addEventListener("pointerup", handleMouseUp);
  };

  return (
    <Box
      h="1"
      my="1.5"
      mx="auto"
      minH="1"
      w="120px"
      bg="bg.muted"
      borderRadius="full"
      cursor="row-resize"
      userSelect="none"
      onMouseDown={handleMouseDown}
      _hover={{ bg: "blue.300" }}
    />
  );
};
