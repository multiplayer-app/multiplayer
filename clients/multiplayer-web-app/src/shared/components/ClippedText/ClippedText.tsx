import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextProps,
  BoxProps,
  Button,
  ButtonProps,
  Text,
} from "@chakra-ui/react";

interface ClippedTextProps extends TextProps {
  lines?: number;
  containerProps?: BoxProps;
  buttonProps?: ButtonProps;
  showExpander?: boolean;
  expanded?: boolean;
}

const ClippedText = ({
  children,
  lines = 10,
  buttonProps = {},
  containerProps = {},
  showExpander = true,
  expanded,
  ...rest
}: ClippedTextProps) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isClipped, setIsClipped] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (!showExpander) {
      setIsExpanded(expanded);
    }
  }, [expanded, showExpander]);

  useEffect(() => {
    if (textRef.current) {
      const totalHeight = textRef.current.scrollHeight;
      const maxHeight =
        parseFloat(getComputedStyle(textRef.current).lineHeight) * lines;
      if (totalHeight > maxHeight) {
        setIsClipped(true);
      }
    }
  }, [children]);

  const toggleText = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <Box {...containerProps}>
      <Text {...rest} ref={textRef} noOfLines={isExpanded ? undefined : lines}>
        {children}
      </Text>
      {isClipped && showExpander && (
        <Button variant="link" {...buttonProps} onClick={toggleText}>
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
      )}
    </Box>
  );
};

export default ClippedText;
