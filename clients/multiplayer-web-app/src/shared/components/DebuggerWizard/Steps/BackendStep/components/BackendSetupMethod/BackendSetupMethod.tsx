import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { ReactComponent as IconCode } from "assets/images/wizard/icon-code.svg";

const BackendSetupMethod = ({ method, selected, setSelected }) => (
  <Box
    borderRadius="16px"
    cursor={"pointer"}
    onClick={setSelected}
    p={4}
    bg={selected ? "rgba(73, 59, 255, 0.05)" : "bg.subtle"}
    border={selected ? "2px solid" : "1px solid"}
    borderColor={selected ? "brand.500" : "bg.muted"}
    _hover={
      !selected && {
        border: "1px solid",
        borderColor: "border.tertiary",
      }
    }
  >
    <Flex alignItems="center" justifyContent="space-between" mb={4} gap="10px">
      <Flex alignItems="center" gap={4}>
        <Icon as={IconCode} width={8} height={8} />
        <Text color="subtle" fontWeight={500} fontSize="16px">
          {method.title}
        </Text>
        <Box
          backgroundColor="green.100"
          color="green.400"
          px={1}
          border="0.5px solid green.200"
          borderRadius="6px"
          fontSize="12px"
          fontWeight={500}
          lineHeight="20px"
          boxShadow="0px -1px 1px 0px #7180961A inset, 0px 1px 1px 0px #FFFFFF80 inset"
        >
          Recommended
        </Box>
      </Flex>

      <Box
        width={6}
        height={6}
        borderRadius="50%"
        border="1px solid"
        flexShrink={0}
        backgroundColor={selected ? "brand.500" : "bg.primary"}
        borderColor={selected ? "brand.500" : "muted"}
        position="relative"
      >
        {selected && (
          <Box
            position="absolute"
            width={3}
            height={3}
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            backgroundColor="bg.primary"
            borderRadius="50%"
          />
        )}
      </Box>
    </Flex>
    <Text color="muted" fontWeight={400} fontSize="sm">
      {method.description}
    </Text>
  </Box>
);

export default BackendSetupMethod;
