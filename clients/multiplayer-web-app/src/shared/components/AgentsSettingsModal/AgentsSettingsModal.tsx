import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import GenerateAgentsApiKey from "../GenerateAgentsApiKey";

const AgentsSettingsModal = ({
  disclosure,
  onCloseComplete,
}: {
  disclosure: UseDisclosureReturn;
  onCloseComplete: () => void;
}) => {
  const { isOpen, onClose } = disclosure;

  return (
    <Modal
      size="5xl"
      isCentered
      isOpen={isOpen}
      onClose={onClose}
      onCloseComplete={onCloseComplete}
    >
      <ModalOverlay />
      <ModalContent borderRadius="24px">
        <ModalHeader borderTopRadius="24px" bg="bg.surface">
          AI Agents API Keys
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          <Text fontSize="sm" color="subtle" mb={6}>
            Generate an API key for the AI agents CLI. Select workspace role and
            team role to scope the key. Pass the key as an environment variable
            and do not store it in your repository.
          </Text>
          <GenerateAgentsApiKey
            searchable
            allowMultiple
            defaultKey="agents-cli-key"
          />
        </ModalBody>
        <ModalFooter borderTopWidth="1px" borderColor="border.primary">
          <Flex justifyContent="flex-end">
            <Button backgroundColor="brand.500" onClick={onClose}>
              Done
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AgentsSettingsModal;
