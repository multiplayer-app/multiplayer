import { Box, TextProps } from "@chakra-ui/react";

interface TraceNodeNameProps extends TextProps {}

const TraceNodeName = ({ children, ...rest }: TraceNodeNameProps) => {
  return (
    <Box
      maxW="33%"
      overflow="hidden"
      whiteSpace="nowrap"
      textOverflow="ellipsis"
      flex="0 0 auto"
      {...rest}
    >
      {children}
    </Box>
  );
};

export default TraceNodeName;
