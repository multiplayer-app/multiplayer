import { Flex, Icon, Text, Tooltip } from "@chakra-ui/react";
import { IEntity, ProjectLinkObjectType } from "@multiplayer/types";
import { LinkIcon } from "shared/icons";
import { IProjectLinkProps } from "shared/models/interfaces";
import { useEntitiesLinks } from "shared/providers/ProjectLinksContext";
import { getNestedProperty } from "shared/utils";

const ItemLink = (props: IProjectLinkProps) => {
  const { links, repoLinks, openLinksModal } = useEntitiesLinks();

  const entity =
    props.objectType === ProjectLinkObjectType.GitFile
      ? getNestedProperty<IEntity>(links, [
          props.gitRepositoryId,
          props.path,
          "targetObject",
        ])
      : getNestedProperty<IEntity>(repoLinks, [
          props.gitRepositoryId,
          "targetObject",
        ]);

  if (props.readonly && !entity) return null;

  return (
    <Flex
      p="0"
      h="5"
      gap="1"
      color="inverse"
      bg="brand.500"
      cursor={!props.readonly ? "pointer" : "default"}
      alignItems="center"
      borderRadius="base"
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        !props.readonly && openLinksModal(props);
      }}
    >
      {entity && (
        <Tooltip label={entity.key}>
          <Text pl="1" fontSize="xs" maxW="20" noOfLines={1}>
            {entity.key}
          </Text>
        </Tooltip>
      )}
      <Icon as={LinkIcon} />
    </Flex>
  );
};

export default ItemLink;
