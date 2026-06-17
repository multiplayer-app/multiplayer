import { BoxProps, Box } from "@chakra-ui/react";

interface PropertyValueTagProps extends BoxProps {}

const PropertyValueTag = ({ children, ...rest }: PropertyValueTagProps) => {
  return (
    <Box
      as="span"
      py="0.5"
      px="1.5"
      bg="bg.surface"
      lineHeight="4"
      color="muted"
      borderWidth="1px"
      borderRadius="lg"
      fontSize="smaller"
      borderColor="border.primary"
      fontFamily="JetBrains Mono, sans-serif"
      {...rest}
    >
      {children}
    </Box>
  );
};

export default PropertyValueTag;
