import {
  Button,
  Flex,
  Heading,
  Icon,
  Img,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ComputerIcon } from "shared/icons";
import { useMobileExperienceModal } from "shared/hooks/useMobileExperienceModal";
import MobileExperienceBg from "assets/images/mobile-experience.png";

const MobileExperienceModal = ({ disclosure }) => {
  return (
    <Modal
      size="xl"
      isCentered
      closeOnOverlayClick={false}
      isOpen={disclosure.isOpen}
      onClose={disclosure.onClose}
    >
      <ModalOverlay />
      <ModalContent fontWeight="medium" borderRadius="24px" margin={2}>
        <ModalHeader p={0} borderRadius="24px 24px 0 0">
          <Img
            src={MobileExperienceBg}
            w="full"
            borderRadius="24px 24px 0 0"
            maxH="315px"
            objectFit="cover"
          />
        </ModalHeader>
        <ModalBody p={6}>
          <VStack alignItems="center" gap={4} textAlign="center">
            <Flex
              width="40px"
              height="40px"
              borderRadius="50%"
              alignItems="center"
              justifyContent="center"
              bg="bg.surface"
            >
              <Icon as={ComputerIcon} boxSize={4} color="muted" />
            </Flex>
            <Heading as="h6" fontSize="lg" color="subtle">
              This feature is best experienced on a desktop or laptop.
            </Heading>
            <Text fontWeight={400} mb={4} color="muted">
              We’ll work on an improve mobile experience soon, but for now, we
              recommend you open up Multiplayer on a desktop-class device.
            </Text>
            <Button w="100%" size="lg" onClick={disclosure.onClose}>
              Continue
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const MobileExperienceModalWrapper = () => {
  const { isOpen, onClose } = useMobileExperienceModal();

  if (!isOpen) {
    return null;
  }

  return <MobileExperienceModal disclosure={{ isOpen, onClose }} />;
};

export default MobileExperienceModalWrapper;
