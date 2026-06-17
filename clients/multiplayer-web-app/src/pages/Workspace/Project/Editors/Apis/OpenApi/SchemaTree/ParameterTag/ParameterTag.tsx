import { BoxProps, Box } from "@chakra-ui/react";

interface ParameterTagProps extends BoxProps {}

const ParameterTag = ({ children, ...rest }: BoxProps) => {
  return (
    <Box
      as="span"
      py="1"
      px="1.5"
      bg="bg.subtle"
      lineHeight="4"
      borderWidth="1px"
      borderRadius="lg"
      borderColor="border.secondary"
      fontFamily="JetBrains Mono, sans-serif"
      {...rest}
    >
      {children}
    </Box>
  );
};

export default ParameterTag;
