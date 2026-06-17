import {
  Box,
  Button,
  Flex,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import SessionExample from "assets/images/previews/mkt-sessions.png";

interface PublicSandboxProps {
  disclosure: UseDisclosureReturn;
}

const PublicSandbox = ({ disclosure }: PublicSandboxProps) => {
  const { isOpen, onClose } = disclosure;

  return (
    <Modal size="3xl" isCentered isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent borderRadius="24px" p={0}>
        <ModalCloseButton color="muted" zIndex={1} />
        <ModalBody p={0} overflow="hidden" borderRadius="24px">
          <Flex
            direction={{ base: "column", md: "row" }}
            alignItems="center"
            gap={12}
            p={8}
            position="relative"
            overflow="hidden"
          >
            <Box
              background="linear-gradient(180deg, #5047E5 0%, #1AE6F3 100%)"
              opacity="10%"
              filter="blur(250px)"
              position="absolute"
              left="-32px"
              w="50%"
              h="full"
              clipPath="inset(0)"
            />
            <Flex flex="1" zIndex={1} direction="column" justify="center">
              <Text
                color="brand.500"
                fontSize="10px"
                fontWeight={500}
                letterSpacing="3%"
                textTransform="uppercase"
                mb={2}
              >
                Welcome to Multiplayer
              </Text>
              <Text fontSize="20px" fontWeight="600" color="subtle" mb={4}>
                Ready to take the controls?
              </Text>
              <Text color="muted" fontSize="14px" mb="44px">
                Our sandbox is read-only. If you want to explore and create,
                start your free Multiplayer trial. Not ready to connect your own
                system yet?{" "}
                <Link
                  isExternal
                  href="https://github.com/multiplayer-app/multiplayer-time-travel-platform"
                  color="brand.500"
                >
                  Fork our demo app
                </Link>{" "}
                and use it to see how a real-life system behaves.
              </Text>

              <Button
                borderRadius="12px"
                mb={3}
                onClick={() => {
                  window.open("https://go.multiplayer.app", "_blank");
                  onClose();
                }}
              >
                Start a free trial
              </Button>

              <Text color="muted" fontSize="12px" textAlign="center">
                By entering sandbox you agree to our{" "}
                <Link
                  href="https://www.multiplayer.app/privacy/"
                  textDecoration="underline"
                  isExternal
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="https://www.multiplayer.app/terms-of-service/"
                  textDecoration="underline"
                  isExternal
                >
                  Terms of Service
                </Link>
                .
              </Text>
            </Flex>

            <Box w="full" maxW="50%">
              <Image
                src={SessionExample}
                border="2px solid"
                borderRadius="8px"
                borderColor="border.primary"
              />
            </Box>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PublicSandbox;
