import { Link } from "react-router-dom";
import { Button, Flex, Image, Text } from "@chakra-ui/react";
import EmptyDocs from "assets/images/emptyStates/documents-empty-list.png";

const Root = () => {
  return (
    <Flex alignItems="center" justifyContent="center" h="full" overflow="auto">
      <Flex
        gap="8"
        px="14"
        pt="4"
        pb="8"
        bg="bg.surface"
        flexDir="column"
        alignItems="center"
        borderRadius="lg"
        border="0.5px solid"
        borderColor="border.secondary"
      >
        <Image w="180px" src={EmptyDocs} alt="empty" />
        <Flex gap="2" flexDir="column" alignItems="center">
          <Text fontWeight="500" fontSize="md" maxW="352px">
            Let’s go to your Debugger Dashboard!
          </Text>
          <Text maxW="352px" textAlign="center">
            Monitor and analyze your debug sessions in real-time, with
            comprehensive insights.
          </Text>
          <Button as={Link} to="debugger" mt="4">
            Go to Debugger Dashboard
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Root;
