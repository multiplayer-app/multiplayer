import {
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Text,
  Icon,
  Flex,
  Box,
} from "@chakra-ui/react";
import AddImplementation from "shared/components/AddImplementation";
import AddApi from "shared/components/AddApi";
import { CollectionTarget } from "shared/models/enums";
import { LinkIcon } from "shared/icons";

const ReposModal = ({ isOpen, onClose, target, entity, addedLinks = [] }) => {
  return (
    <Modal
      size="4xl"
      isCentered
      isOpen={isOpen}
      onClose={() => onClose(target)}
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent fontWeight="medium">
        <ModalCloseButton color="muted" zIndex="2" />
        <ModalBody p="0">
          {target === CollectionTarget.API ? (
            <>
              <Text
                mb={4}
                fontSize="20px"
                fontWeight="600"
                color="subtle"
                p={4}
                pb={0}
              >
                Add an API
              </Text>
              <Box p={4}>
                <AddApi
                  addedLinks={addedLinks}
                  entity={entity}
                  onClose={() => onClose(CollectionTarget.API)}
                />
              </Box>
            </>
          ) : (
            <>
              <Flex
                gap="2"
                p="4"
                borderBottom="1px solid"
                borderColor="border.secondary"
              >
                <Icon
                  color="inverse"
                  bg="brand.500"
                  borderRadius="base"
                  as={LinkIcon}
                />
                <Text>Link a code</Text>
              </Flex>
              <AddImplementation
                addedLinks={addedLinks}
                entity={entity}
                onClose={() => onClose(CollectionTarget.CODE)}
              />
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ReposModal;
