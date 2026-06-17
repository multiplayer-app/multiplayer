import {
  Icon,
  Flex,
  Text,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Box,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import { GitRefTagType } from "@multiplayer/types";
import { integrationTypes, sourceIconMap } from "shared/configs/git.configs";
import { IProjectTagProps } from "shared/models/interfaces";
import { TagIcon } from "shared/icons";
import TagInput from "../TagInput";

const TagEntityModal = ({
  tags,
  target,
  disclosure,
  onClose,
  onChange,
}: {
  onClose: () => void;
  onChange: (arg: any) => void;
  target: IProjectTagProps;
  disclosure: UseDisclosureReturn;
  tags: any;
}) => {
  if (!target) return null;

  const isFile = target.type === GitRefTagType.GIT_FILE;
  const path = isFile
    ? `/${target.path.split("/").slice(0, -1).join("/")}`
    : `${integrationTypes[target.gitRepositoryType].label} repository`;

  const handleChange = (values) => {
    onChange(values);
  };

  return (
    <Modal
      size="4xl"
      isCentered
      onCloseComplete={onClose}
      isOpen={disclosure.isOpen}
      onClose={disclosure.onClose}
    >
      <ModalOverlay />
      <ModalContent fontWeight="medium">
        <Flex alignItems="center" p="4" gap="2">
          <Icon
            color="yellow.700"
            bg="yellow.500"
            borderRadius="base"
            as={TagIcon}
          />
          <Text>{isFile ? "Tagging" : "Tag this repository"}</Text>
          <ModalCloseButton />
        </Flex>
        <ModalBody p="0">
          {target && (
            <Flex
              gap="2"
              px="4"
              h="12"
              bg="bg.surface"
              borderTop="1px"
              borderBottom="1px"
              alignItems="center"
              borderColor="border.primary"
            >
              <Icon as={sourceIconMap[target.sourceType]} />
              {target.name}
              <Text ml="auto" color="muted">
                {path}
              </Text>
            </Flex>
          )}
          <Box p="4">
            <TagInput
              value={tags}
              suggestions={target.systemTags}
              onChange={handleChange}
            />
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TagEntityModal;
