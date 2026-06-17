import {
  Button,
  Flex,
  Icon,
  Input,
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
import { useState } from "react";
import { RadarIcon2 } from "shared/icons";

const DeleteIntegrationConfirmationModal = ({
  disclosure,
  integrationName,
  onDelete,
}: {
  integrationName: string;
  disclosure: UseDisclosureReturn;
  onDelete: () => void;
}) => {
  const { isOpen, onClose } = disclosure;
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <Modal
      size="xl"
      isCentered
      isOpen={isOpen}
      onClose={onClose}
      onCloseComplete={() => {
        setInputValue("");
      }}
    >
      <ModalOverlay />
      <ModalContent role="alertdialog">
        <ModalHeader
          fontSize="lg"
          backgroundColor="bg.surface"
          borderTopLeftRadius="md"
          borderTopRightRadius="md"
        >
          Delete API Key
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody flexDirection="column">
          <Flex
            alignItems="center"
            justifyContent="center"
            direction="column"
            gap="2"
            py="6"
          >
            <Icon as={RadarIcon2} width="24px" height="24px"></Icon>
            <Text>{integrationName}</Text>
            {/*<Text color="muted">34 components auto-documented</Text>*/}
          </Flex>
          <Text mb="1">
            To confirm, type <b>{integrationName}</b> into the input below
          </Text>
          <Input
            placeholder={`Enter key here`}
            value={inputValue}
            onChange={handleInputChange}
          />
        </ModalBody>
        <ModalFooter gap="2">
          <Button
            width="full"
            variant="dangerLight"
            onClick={onDelete}
            isDisabled={inputValue !== integrationName}
          >
            Delete this API key
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteIntegrationConfirmationModal;
