import { useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  Text,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import SlugifiedInput from "shared/components/SlugifiedInput";

const EditEntityNameModal = ({
  disclosure,
  previousName,
  onNameChange,
  shouldShowAliasToggle = false,
}: {
  previousName: string;
  disclosure: UseDisclosureReturn;
  shouldShowAliasToggle?: boolean;
  onNameChange: (newName: string, shouldAddAlias: boolean) => void;
}) => {
  const [name, setName] = useState(previousName);
  const [addAlias, setAddAlias] = useState(false);

  const canChangeName = name !== "" && name !== previousName;

  const confirmNameChange = () => {
    onNameChange(name, addAlias);
    disclosure.onClose();
  };

  const closeModal = () => {
    setName(previousName);
    disclosure.onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && canChangeName) {
      confirmNameChange();
    }
  };

  return (
    <Modal size="lg" isCentered isOpen={disclosure.isOpen} onClose={closeModal}>
      <ModalOverlay />
      <ModalContent borderRadius="3xl">
        <ModalHeader bg="bg.surface" borderRadius="24px 24px 0 0">
          Change name
        </ModalHeader>
        <ModalBody gap="4" flexDirection="column">
          <FormControl isRequired>
            <FormLabel>Entity name</FormLabel>
            <SlugifiedInput
              placeholder="Enter a name..."
              value={name}
              onChange={setName}
              onKeyDown={onKeyDown}
            />
            <Text fontSize="xs" mt="1" color="muted">
              The name may contain only lowercase letters, numbers or dashes.
              Must start with a letter only. E.g. 'auth-service',
              'production-env'.
            </Text>
          </FormControl>
          {shouldShowAliasToggle && (
            <FormControl mt="4">
              <FormLabel>
                Add the previous name as an alias to this component?
              </FormLabel>
              <Switch
                colorScheme="brand"
                checked={addAlias}
                onChange={(e) => setAddAlias(e.target.checked)}
              />
            </FormControl>
          )}
        </ModalBody>
        <ModalFooter gap="4">
          <Button isDisabled={!canChangeName} onClick={confirmNameChange}>
            Confirm
          </Button>
          <Button variant="light" onClick={closeModal}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditEntityNameModal;
