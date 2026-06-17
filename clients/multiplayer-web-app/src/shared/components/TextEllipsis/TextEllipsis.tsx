import { Text, TextProps } from "@chakra-ui/react";

interface TextEllipsisProps extends TextProps {}

const TextEllipsis = (props: TextEllipsisProps) => {
  return (
    <Text
      {...props}
      overflow="hidden"
      whiteSpace="nowrap"
      textOverflow="ellipsis"
    />
  );
};

export default TextEllipsis;
