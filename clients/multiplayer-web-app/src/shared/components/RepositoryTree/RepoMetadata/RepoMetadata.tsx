import { useEffect, useMemo } from "react";
import { Flex, Icon, useDisclosure } from "@chakra-ui/react";
import {
  GitRefTagType,
  IEntity,
  ProjectLinkObjectType,
} from "@multiplayer/types";
import { MetadataIcon } from "shared/icons";
import { getNestedProperty } from "shared/utils";
import { useEntitiesTags } from "shared/providers/ProjectTagsContext";
import { useEntitiesLinks } from "shared/providers/ProjectLinksContext";
import MetadataModal from "shared/components/RepositoryTree/MetadataModal";

const RepoMetadata = ({ item, isShown, updateShownState }) => {
  const metadataDisclosure = useDisclosure();
  const { tags, repoTags, setTarget, onTagsChanged } = useEntitiesTags();
  const { links, repoLinks } = useEntitiesLinks();

  const entity = useMemo(() => {
    return item.objectType === ProjectLinkObjectType.GitFile
      ? getNestedProperty<IEntity>(links, [
          item.gitRepositoryId,
          item.path,
          "targetObject",
        ])
      : getNestedProperty<IEntity>(repoLinks, [
          item.gitRepositoryId,
          "targetObject",
        ]);
  }, [item, links, repoLinks]);

  const itemTags = useMemo(() => {
    return item.type === GitRefTagType.GIT_FILE
      ? getNestedProperty(tags, [item.gitRepositoryId, item.path, "tags"], [])
      : getNestedProperty(repoTags, [item.gitRepositoryId, "tags"], []);
  }, [item, tags, repoTags]);

  const hasProperties = itemTags.length || !!entity;

  useEffect(() => {
    if (isShown) {
      setTarget(item);
    }
  }, [isShown, item]);

  const onMetadataClick = () => {
    metadataDisclosure.onOpen();
    updateShownState(false);
  };

  return (
    <Flex
      key={item.path + item.name}
      display={hasProperties || isShown ? "flex" : "none"}
      onClick={(e) => e.stopPropagation()}
    >
      <Icon
        as={MetadataIcon}
        onClick={onMetadataClick}
        __css={
          hasProperties && {
            "> path": { fill: "inverse" },
            "> rect": { fill: "brand.500", stroke: "brand.500" },
          }
        }
      />
      {metadataDisclosure.isOpen && (
        <MetadataModal
          item={item}
          tags={itemTags}
          onTagChange={onTagsChanged}
          disclosure={metadataDisclosure}
        />
      )}
    </Flex>
  );
};

export default RepoMetadata;
