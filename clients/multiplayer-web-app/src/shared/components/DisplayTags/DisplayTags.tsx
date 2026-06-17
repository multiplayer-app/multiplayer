import { Box, Tooltip } from "@chakra-ui/react";
import { ITag } from "@multiplayer/types";
import { useMemo } from "react";
import Tag from "shared/components/Tag";

interface DisplayTagsProps {
  tags: ITag[];
  visibleTagsCount?: number;
}

const DisplayTags = ({ tags, visibleTagsCount = 1 }: DisplayTagsProps) => {
  const normalizedTags = useMemo(
    () => tags.map((t) => (typeof t === "string" ? { key: t, value: t } : t)),
    [tags]
  );
  if (normalizedTags.length === 0) {
    return null;
  } else if (normalizedTags.length === 1) {
    return <Tag key={normalizedTags[0].value} name={normalizedTags[0].value} />;
  } else {
    const visibleItems = normalizedTags.slice(0, visibleTagsCount);
    const remainingItems = normalizedTags.slice(visibleTagsCount);

    return (
      <>
        {visibleItems.map((tag) => (
          <Tag key={tag.value} name={tag.value} />
        ))}
        {!!remainingItems.length && (
          <Tooltip label={remainingItems.map((t) => t.value).join(", ")}>
            <Box>
              <Tag name={`+${remainingItems.length}`} />
            </Box>
          </Tooltip>
        )}
      </>
    );
  }
};

export default DisplayTags;
