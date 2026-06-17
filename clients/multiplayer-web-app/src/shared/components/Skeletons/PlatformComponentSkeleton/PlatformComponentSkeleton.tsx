import { Box, Flex, Skeleton, SkeletonProps } from "@chakra-ui/react";

interface PlatformComponentSkeletonProps {}

const PlatformComponentSkeleton = (props: PlatformComponentSkeletonProps) => {
  return (
    <Box flex="1" overflow="auto" px="4">
      <Box py="64px" w="full" mx="auto" maxW="848px">
        <Flex alignItems="center" gap="4">
          <S w="100px" h="100px" />
          <Box>
            <S w="172px" h="4" mb="3" />
            <S w="110px" h="3" />
          </Box>
        </Flex>
        <S w="208px" h="3" ml="4" mt="38px" />
        <Box as="hr" mt="19px" mb="80px" borderColor="border.primary" />
        <Flex flexDir="column" gap="4">
          <Flex gap="4">
            <Group />
            <Group />
          </Flex>
          <Group />
          <Flex gap="4">
            <Group />
            <Group />
            <Group />
          </Flex>
          <Flex gap="4" mt="10">
            <Box flex="1" borderRadius="8px" bg="bg.surface" h="131px" />
            <Box flex="1" borderRadius="8px" bg="bg.surface" h="131px" />
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

const Group = () => {
  return (
    <Box flex="1">
      <S w="172px" h="4" mb="3" />
      <Box borderRadius="8px" bg="bg.surface" p="4">
        <S w="60px" h="4" mb="3" />
      </Box>
    </Box>
  );
};

const S = ({ children, ...props }: SkeletonProps) => {
  return (
    <Skeleton
      borderRadius="18px"
      startColor="#F9FAFB"
      endColor="#F0F0F0"
      {...props}
    >
      {children}
    </Skeleton>
  );
};

export default PlatformComponentSkeleton;
