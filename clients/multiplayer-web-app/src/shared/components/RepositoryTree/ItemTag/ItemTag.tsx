import { Box, Flex, Icon, Tooltip } from "@chakra-ui/react";
import { GitRefTagType } from "@multiplayer/types";

import { TagIcon } from "shared/icons";
import Tag from "shared/components/Tag";
import { getNestedProperty } from "shared/utils";
import { IProjectTagProps } from "shared/models/interfaces";
import { useEntitiesTags } from "shared/providers/ProjectTagsContext";

const ItemTag = (props: IProjectTagProps) => {
  const { tags, repoTags, openTagModal } = useEntitiesTags();

  const itemTags =
    props.type === GitRefTagType.GIT_FILE
      ? getNestedProperty(tags, [props.gitRepositoryId, props.path, "tags"], [])
      : getNestedProperty(repoTags, [props.gitRepositoryId, "tags"], []);

  return (
    <>
      <DisplayTags tags={itemTags} />
      {!props.readonly ? (
        <Flex
          p="0"
          h="5"
          gap="2"
          border="1px"
          bg="yellow.50"
          cursor="pointer"
          color="yellow.600"
          borderRadius="base"
          borderColor="blackAlpha.50"
          onDoubleClick={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            openTagModal(props);
          }}
        >
          <Icon as={TagIcon} />
        </Flex>
      ) : null}
    </>
  );
};

const DisplayTags = ({ tags }) => {
  if (tags.length === 0) {
    return null;
  } else if (tags.length === 1) {
    return <Tag key={tags[0]._id} name={tags[0].name} />;
  } else {
    const remainingItems = tags.slice(1);

    return (
      <>
        <Tag key={tags[0]._id} name={tags[0].name} />
        <Tooltip label={remainingItems.map((t) => t.name).join(", ")}>
          <Box>
            <Tag name={`+${remainingItems.length}`} />
          </Box>
        </Tooltip>
      </>
    );
  }
};
export default ItemTag;
