import { Box, TagProps as ChakraTagProps } from "@chakra-ui/react";
import { forwardRef, useMemo } from "react";

interface TagProps extends ChakraTagProps {
  name: string;
  isSelected?: boolean;
  onRemove?: (val: string) => void;
}

const Tag = forwardRef<any, TagProps>(
  ({ name, isSelected, onClick, ...rest }, ref) => {
    const color = useMemo(() => stringToColor(name), [name]);
    return (
      <Box
        ref={ref}
        fontSize="xs"
        px="2"
        border="1px"
        rounded="full"
        color={`${color}.800`}
        borderColor="blackAlpha.50"
        cursor={onClick ? "pointer" : "default"}
        bg={`${color}.${isSelected ? "200" : "100"}`}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            e.stopPropagation();
            onClick(e);
          }
        }}
        {...rest}
      >
        {name}
      </Box>
    );
  }
);

const COLORS = [
  "gray",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "cyan",
  "purple",
  "pink",
];

const hashString = (string) =>
  string
    .split("")
    .map((char) => char.charCodeAt(0))
    .reduce((a, b) => a + b, 0);

const stringToColor = (string) =>
  typeof string === "string"
    ? COLORS[hashString(string) % COLORS.length]
    : "gray";

export default Tag;
