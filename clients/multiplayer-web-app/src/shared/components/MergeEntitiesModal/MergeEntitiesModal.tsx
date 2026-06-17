import { useEffect, useState } from "react";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { ComponentType, EntityType } from "@multiplayer/types";
import { QuestionOutlineIcon } from "@chakra-ui/icons";

import SlugifiedInput from "shared/components/SlugifiedInput";
import NodeIcon from "shared/components/NodeIcon";
import Table from "shared/components/Table";

const MergeEntitiesModal = ({
  disclosure,
  count,
  type,
  selectedComponents,
  onMerge,
}) => {
  const [key, setKey] = useState("");

  useEffect(() => {
    setKey(selectedComponents[0]?.key);
  }, [selectedComponents]);

  return (
    <Modal
      isCentered
      size="2xl"
      closeOnOverlayClick={false}
      isOpen={disclosure.isOpen}
      onClose={disclosure.onClose}
    >
      <ModalOverlay />
      <ModalContent borderRadius="24px">
        <ModalHeader bg="bg.surface" borderRadius="24px 24px 0 0">
          Merging {count} {type}s into 1
        </ModalHeader>
        <ModalCloseButton color="muted" zIndex="2" m="2" />
        <ModalBody>
          <Flex direction="column" gap="6">
            <Text color="muted">
              To eliminate clutter, you can merge the selected {type}s into a
              new {type}. Name your new {type}, and all of the selected ones
              will be added as an alias.
            </Text>
            <FormControl>
              <FormLabel textTransform="capitalize">{type} Name</FormLabel>
              <InputGroup w="320px">
                <SlugifiedInput
                  key="componentName"
                  autoFocus
                  value={key}
                  placeholder={`Enter name for the final ${type}`}
                  onChange={setKey}
                ></SlugifiedInput>
                <InputRightElement
                  children={
                    <Tooltip
                      label={`Type a name and a new ${type} will be created with the given name. If ${type} with that name exists, it will replace all the selected ${type}s in platforms. You cannot leave this field empty.`}
                    >
                      <Icon as={QuestionOutlineIcon} color="muted" w="18px" />
                    </Tooltip>
                  }
                ></InputRightElement>
              </InputGroup>
            </FormControl>
            <Table
              columns={[
                {
                  field: "key",
                  name: `Selected ${type}s`,
                  sortable: false,
                  component: ({ key, id }) => (
                    <Flex
                      key={id}
                      flex="1"
                      alignItems="center"
                      userSelect="none"
                    >
                      <NodeIcon
                        type={
                          type === "component"
                            ? ComponentType.GENERIC
                            : EntityType.ENVIRONMENT
                        }
                        mr="8px"
                      />
                      {key}
                    </Flex>
                  ),
                },
              ]}
              tableWrapperHeight="232px"
              data={selectedComponents}
            />
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button
            isDisabled={!key}
            onClick={() => {
              onMerge(key);
            }}
          >
            Confirm merge
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MergeEntitiesModal;
