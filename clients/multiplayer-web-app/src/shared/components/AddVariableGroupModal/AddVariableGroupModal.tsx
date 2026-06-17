import { useEffect, useMemo, useState } from "react";
import debounce from "lodash.debounce";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Portal,
  Text,
  Tooltip,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import { v4 as uuidv4 } from "uuid";
import { VariableGroup } from "@multiplayer/types";
import { InfoCircleIcon, LockIcon } from "shared/icons";
import useSlugifiedName from "shared/hooks/useSlugifiedName";
import { useFullScreenContext } from "shared/providers/FullScreenContext";
import SlugifiedInput from "shared/components/SlugifiedInput";

const AddVariableGroupModal = ({
  disclosure,
  parent,
  onChange,
  onClose,
}: {
  disclosure: UseDisclosureReturn;
  parent: VariableGroup;
  onChange: (groupId: string, value: any, parentKey: string) => void;
  onClose: () => void;
}) => {
  const { containerRef } = useFullScreenContext();
  const [name, setName] = useState("");
  const [duplicateNameError, setDuplicateNameError] = useState(false);
  const { slugifiedName, setSlugifiedName } = useSlugifiedName(name, (val) => {
    setName(val);
  });

  const onAdd = () => {
    const isDuplicate = validateNameSync(name);
    setDuplicateNameError(isDuplicate);
    if (!isDuplicate && name.trim() !== "") {
      onChange(uuidv4(), { name: name }, parent?.id);
      onModalClose();
    }
  };

  const validateNameSync = (nameToValidate: string) => {
    const groupNamesInParent = parent?.groups
      ? Object.values(parent.groups)?.map((i) => i.name)
      : [];
    return groupNamesInParent.includes(nameToValidate);
  };

  const validateName = useMemo(
    () =>
      debounce((name: string) => {
        const isDuplicate = validateNameSync(name);
        setDuplicateNameError(isDuplicate);
      }, 200),
    [parent?.groups]
  );

  useEffect(() => {
    if (slugifiedName.trim() !== "") {
      validateName(slugifiedName);
    } else {
      setDuplicateNameError(false);
    }

    return () => {
      validateName.cancel();
    };
  }, [slugifiedName, validateName]);

  const onModalClose = () => {
    disclosure.onClose();
    onClose();
  };

  useEffect(() => {
    setSlugifiedName(name);
  }, [name]);

  return (
    <Portal containerRef={containerRef}>
      <Modal
        size="4xl"
        isCentered
        isOpen={disclosure.isOpen}
        closeOnOverlayClick={false}
        onClose={onModalClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader backgroundColor="#F9FAFB" mb={6} borderTopRadius={16}>
            Create a new variable group
            <Text fontWeight="normal" color="muted" fontSize="sm" my={4}>
              You’ll then be able to edit, link and document <br /> your
              variables in Multiplayer.
            </Text>
          </ModalHeader>
          <ModalCloseButton color="muted" zIndex="2" />
          <ModalBody pb="6" pt="0">
            <Flex gap={4}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <InputGroup alignItems="center">
                  <SlugifiedInput
                    autoFocus
                    placeholder="Enter group name..."
                    value={name}
                    onBlur={onAdd}
                    onChange={setName}
                    onKeyDown={(e) => e.key === "Enter" && onAdd()}
                  ></SlugifiedInput>
                  {duplicateNameError && (
                    <InputRightElement
                      children={
                        <Tooltip label="Group name cannot be duplicate">
                          <Icon as={InfoCircleIcon} color="red.500" />
                        </Tooltip>
                      }
                    />
                  )}
                </InputGroup>
              </FormControl>
              {parent && (
                <FormControl>
                  <FormLabel>Parent variable group</FormLabel>
                  <InputGroup alignItems="center">
                    <Input
                      placeholder="Enter group name..."
                      value={parent.name}
                      disabled
                      cursor="default !important"
                      opacity="1 !important"
                    />
                    <InputLeftElement
                      children={<Icon as={LockIcon} color="muted" />}
                    />
                  </InputGroup>
                </FormControl>
              )}
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              isDisabled={!slugifiedName || duplicateNameError}
              onClick={onAdd}
            >
              Create variable group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Portal>
  );
};

export default AddVariableGroupModal;
