import { Box, Flex, Text } from "@chakra-ui/react";

const GenericEndpoint = ({ chunks }: { chunks: string[] }) => {
  const data = chunks.filter((chunk) => !!chunk);

  return data.length ? (
    <Flex
      bg="bg.primary"
      minW="100px"
      flexShrink="1"
      fontSize="13px"
      cursor="pointer"
      color="muted"
      border="solid 1px"
      borderRadius="base"
      borderColor="border.primary"
      fontFamily="JetBrains Mono, sans-serif"
      whiteSpace="nowrap"
    >
      {data.map((chunk: string, i) => {
        return (
          <Box
            key={chunk}
            p="1"
            borderRight="1px solid"
            borderColor="border.primary"
          >
            <Text
              flex="1"
              minW="0"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              title={chunk}
            >
              {chunk}
            </Text>
          </Box>
        );
      })}
    </Flex>
  ) : null;
};

export default GenericEndpoint;
