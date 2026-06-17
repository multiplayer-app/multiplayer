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
import SessionExample from "assets/images/previews/multiplayer-terminal.png";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { config } from "../../../config";
import {
  SANDBOX_TOUR_LS_ARMED_KEY,
  SANDBOX_TOUR_LS_COMPLETED_KEY,
} from "shared/providers/SandboxTourProvider";

interface MultiplayerSandboxProps {
  disclosure: UseDisclosureReturn;
  onCloseComplete: () => void;
}

const MultiplayerSandbox = ({
  disclosure,
  onCloseComplete,
}: MultiplayerSandboxProps) => {
  const { isOpen, onClose } = disclosure;
  const { isSandbox } = useProjectSandbox();

  const armSandboxTour = () => {
    try {
      const completed =
        localStorage.getItem(SANDBOX_TOUR_LS_COMPLETED_KEY) === "1";
      if (!completed) {
        localStorage.setItem(SANDBOX_TOUR_LS_ARMED_KEY, "1");
        window.dispatchEvent(new CustomEvent("mp:sandboxTour:armed"));
      }
    } catch {
      // ignore
    }
  };

  const handleCloseComplete = () => {
    armSandboxTour();
    onCloseComplete?.();
  };

  return (
    <Modal
      size="3xl"
      isCentered
      isOpen={isOpen}
      onClose={onClose}
      onCloseComplete={handleCloseComplete}
    >
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
                BEFORE YOU START YOUR FREE TRIAL...
              </Text>
              <Text fontSize="14px" fontWeight="600" color="subtle" mb={1}>
                Take 2 minutes to see Multiplayer in action
              </Text>
              <Text color="muted" fontSize="14px" mb="44px">
                The Multiplayer sandbox is powered by our “Time Travel” demo app
                and shows our debugging agent in action. Each debugging session
                is a new bug being fixed!
              </Text>

              <Button
                borderRadius="12px"
                mb={3}
                zIndex={2}
                onClick={() => {
                  if (isSandbox) {
                    onClose();
                  } else {
                    window.open(config.REACT_APP_SANDBOX_URL, "_blank");
                  }
                }}
              >
                Check it out
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

export default MultiplayerSandbox;
