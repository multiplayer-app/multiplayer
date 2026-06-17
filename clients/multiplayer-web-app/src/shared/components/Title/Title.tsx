import { Flex, Icon, Box } from "@chakra-ui/react";

const Title = ({ icon = null, children }) => {
  return (
    <Flex color="muted" mb="4" gap="2">
      {!!icon && (
        <Icon
          as={icon}
          color="brand.500"
          __css={{ "> *": { fill: "brand.500" } }}
        />
      )}
      <Box fontWeight="500" color="brand.500">
        {children}
      </Box>
    </Flex>
  );
};

export default Title;
