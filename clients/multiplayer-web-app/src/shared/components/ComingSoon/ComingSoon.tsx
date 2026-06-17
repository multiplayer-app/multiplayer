import {
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import comingSoon from "assets/images/previews/coming-soon.jpg";

const ComingSoon = ({
  isOpen = false,
  onClose = null,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) => {
  return (
    <Modal size="md" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        flexDirection="column"
        alignItems="center"
        borderRadius="3xl"
      >
        <ModalCloseButton color="muted" position="absolute" right={2} top={2} />
        <Image
          src={comingSoon}
          w="480px"
          borderTopLeftRadius="3xl"
          borderTopRightRadius="3xl"
        />
        <ModalBody textAlign="center" pt="8" pb="6">
          <Text color="subtle" mb="4" fontSize="xl" fontWeight="600">
            We hear you. This feature is coming soon!
          </Text>
          <Text color="muted" fontSize="sm" fontWeight="500">
            We’ll let you know via email when we’re close to shipping <br />
            this functionality.
          </Text>
        </ModalBody>
        {/*<ModalFooter pb="6">
          <Button
            onClick={onClose}
            colorScheme="blue"
          >
            Get notified when we launch this
          </Button>
        </ModalFooter>*/}
      </ModalContent>
    </Modal>
  );
};

export default ComingSoon;
