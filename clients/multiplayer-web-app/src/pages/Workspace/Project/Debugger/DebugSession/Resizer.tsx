import { useMemo, useRef } from "react";
import { Flex, Icon } from "@chakra-ui/react";
import { useDebugSessionLayout } from "./DebugSessionLayoutContext";
import { ResizerIcon } from "shared/icons";

export const ResizeHandle = () => {
  const { handleResize, configs } = useDebugSessionLayout();
  const prevX = useRef(0);
  const prevY = useRef(0);

  const handleMouseMove = ({ movementX, movementY }) => {
    handleResize(movementX, movementY);
  };

  const handleMouseDown = () => {
    const handleMouseUp = () => {
      document.removeEventListener("pointermove", handleMouseMove);
      document.removeEventListener("pointerup", handleMouseUp);
    };

    document.addEventListener("pointermove", handleMouseMove);
    document.addEventListener("pointerup", handleMouseUp);
  };

  const handleTouchMove = ({ touches }) => {
    const touch = touches[0];
    const movementX = touch.clientX - prevX.current;
    const movementY = touch.clientY - prevY.current;

    prevX.current = touch.clientX;
    prevY.current = touch.clientY;

    handleResize(movementX, movementY);
  };

  const handleTouchStart = ({ touches }) => {
    const touch = touches[0];
    prevX.current = touch.clientX;
    prevY.current = touch.clientY;

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  const viewProps = useMemo(
    () =>
      configs.isListView
        ? {
            h: "14px",
            w: "full",
            my: "1px",
            cursor: "row-resize",
            justifyContent: "center",
          }
        : {
            h: "full",
            w: "14px",
            mx: "1px",
            cursor: "col-resize",
            alignItems: "center",
          },
    [configs.isListView]
  );

  return (
    <Flex
      minH="1"
      borderRadius="full"
      userSelect="none"
      onMouseDown={handleMouseDown}
      onTouchStartCapture={handleTouchStart}
      _hover={{ bg: "bg.subtle" }}
      {...viewProps}
    >
      <Icon
        as={ResizerIcon}
        boxSize="14px"
        transform={configs.isListView ? "rotate(90deg)" : "unset"}
      />
    </Flex>
  );
};
