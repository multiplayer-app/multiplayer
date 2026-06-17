import { Flex, Text, Stack } from "@chakra-ui/react";

interface UsersHeaderProps {}

const UsersHeader = (props: UsersHeaderProps) => {
  return (
    <Flex
      gap="2"
      py="4"
      alignItems="center"
      px={{ base: "4", lg: "10" }}
      justifyContent="space-between"
    >
      <Stack gap="2">
        <Text fontSize="24px" fontWeight="600">
          Users
        </Text>
      </Stack>
    </Flex>
  );
};

export default UsersHeader;
