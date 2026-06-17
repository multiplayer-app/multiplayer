import {
  Box,
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import { EntityType, IEntity, ProjectLinkObjectType } from "@multiplayer/types";
import { LinkIcon } from "shared/icons";
import {
  getSupportedEntitiesByGitObject,
  integrationTypes,
  sourceIconMap,
} from "shared/configs/git.configs";
import { entityDetails } from "shared/configs/project.configs";
import EntityIcon from "../EntityIcon";
import DebounceSearch from "../DebounceSearch/DebounceSearch";
import { useMemo, useState } from "react";
import { useEntities } from "shared/providers/EntitiesContext";
import { IProjectLinkProps } from "shared/models/interfaces";

const LinkEntityModal = ({
  target,
  disclosure,
  onClose,
  onChange,
}: {
  onClose: () => void;
  onChange: (arg: IEntity) => void;
  target: IProjectLinkProps;
  disclosure: UseDisclosureReturn;
}) => {
  const { onEntityCreate } = useEntities();

  if (!target) return null;
  const isFile = target.objectType === ProjectLinkObjectType.GitFile;
  const path = isFile
    ? `/${target.path.split("/").slice(0, -1).join("/")}`
    : `${integrationTypes[target.gitRepositoryType].label} repository`;

  const handleCreateAndLink = async (type: EntityType) => {
    const body = { key: target.name, type }; //target.name.split(".").slice(0, -1).join(".") || target.name,
    if (isFile && type !== EntityType.PLATFORM_COMPONENT) {
      // I suppose this last check is needed
      body["gitRef"] = {
        path: target.path,
        branch: target.gitDefaultBranch,
        repositoryId: target.gitRepositoryId,
        repositoryType: target.gitRepositoryType,
      };
    }
    const res = await onEntityCreate(body);
    onChange(res);
  };

  const handleLink = (entity: IEntity) => {
    onChange(entity);
  };

  const supportedEntities = getSupportedEntitiesByGitObject(target.sourceType);

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
            color="inverse"
            bg="brand.500"
            borderRadius="base"
            as={LinkIcon}
          />
          <Text>Link or create an entity</Text>
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
          <Flex py="4">
            <Box px="4" flex="1">
              <Text mb="4">Create a new entity as</Text>
              {Array.from(supportedEntities).map((key: EntityType) => (
                <ListItem key={key} onClick={() => handleCreateAndLink(key)}>
                  <EntityIcon boxSize="6" name={key as EntityType} />
                  {entityDetails[key].title}
                </ListItem>
              ))}
            </Box>
            <Box w="1px" mx="2" bg="bg.muted" minH="210px" />
            <Box px="4" flex="1">
              <Text>Link to an existing entity</Text>
              <EntityList onClick={handleLink} types={supportedEntities} />
            </Box>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const EntityList = ({ types, onClick }) => {
  const [query, setQuery] = useState("");
  const { allEntities } = useEntities();

  const list = useMemo(() => {
    if (query) {
      return allEntities.filter(
        (e) =>
          types.has(e.type) && e.key.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      return allEntities.filter((e) => types.has(e.type)).slice(0, 5);
    }
  }, [query, allEntities]);

  return (
    <>
      <DebounceSearch onSearch={setQuery} />
      <Box maxH="120px" overflow="auto" mx="-2">
        {list.map((entity) => (
          <ListItem key={entity.entityId} onClick={() => onClick(entity)}>
            <EntityIcon boxSize="6" name={entity.type} />
            {entity.key}
          </ListItem>
        ))}
      </Box>
    </>
  );
};

const ListItem = ({ children, onClick }) => (
  <Flex
    py="2"
    px="2"
    gap="2"
    cursor="pointer"
    borderRadius="base"
    alignItems="center"
    _hover={{
      bg: "bg.subtle",
    }}
    onClick={onClick}
  >
    {children}
  </Flex>
);
export default LinkEntityModal;
