import { useEffect, useState } from "react";
import { Box, FlexProps } from "@chakra-ui/react";

interface IResizableBoxProps extends FlexProps {
  minW?: number;
  maxW?: number;
  resizeDirection?: "left" | "right";
}

const ResizableBox = ({
  w = 200,
  minW = 200,
  maxW = Infinity,
  resizeDirection = "right",
  children,
  ...rest
}: IResizableBoxProps) => {
  const [width, setWidth] = useState<any>(w);

  useEffect(() => {
    setWidth(w);
  }, [w]);

  const handleMouseDown = (event) => {
    const startX = event.pageX;
    const initialWidth = width;

    const handleMouseMove = (event) => {
      window.requestAnimationFrame(() => {
        const dx =
          resizeDirection === "right"
            ? event.pageX - startX
            : startX - event.pageX;

        const newWidth = Math.max(minW, Math.min(initialWidth + dx, maxW));
        setWidth(newWidth);
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <Box
      {...rest}
      style={{
        width: `${width}px`,
        maxWidth: `${width}px`,
      }}
      position="relative"
      userSelect="none"
    >
      <Box
        position="absolute"
        top="0"
        width="6px"
        bottom="0"
        userSelect="none"
        cursor="col-resize"
        _hover={{ bg: "blue.300" }}
        transition="background .3s linear .2s"
        onMouseDown={handleMouseDown}
        zIndex="22"
        {...(resizeDirection === "right" ? { right: "-0.5" } : { left: "0" })}
      />
      {children}
    </Box>
  );
};

export default ResizableBox;
