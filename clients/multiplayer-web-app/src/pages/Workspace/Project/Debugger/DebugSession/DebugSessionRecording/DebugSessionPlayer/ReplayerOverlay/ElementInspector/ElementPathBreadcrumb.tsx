import { Fragment } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";

import { ElementPath } from "./ElementInspector";
import { formatPathSegmentLabel } from "./elementPathUtils";

interface ElementPathBreadcrumbProps {
  path: ElementPath[];
  selectedIndex: number;
  hoveredIndex: number | null;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  onPrune: (index: number) => void;
}

const ElementPathBreadcrumb = ({
  path,
  selectedIndex,
  hoveredIndex,
  onSelect,
  onHover,
  onPrune,
}: ElementPathBreadcrumbProps) => {
  if (!path.length) return null;

  return (
    <HStack
      flexWrap="wrap"
      gap={0.5}
      align="center"
      lineHeight="short"
      onMouseLeave={() => onHover(null)}
    >
      {path.map((item, index) => {
        const isSelected = index === selectedIndex;
        const isHovered = index === hoveredIndex;

        return (
          <Fragment key={`${item.tagName}-${item.id ?? index}`}>
            {index > 0 && (
              <Text
                fontSize="2xs"
                color="gray.400"
                as="span"
                userSelect="none"
                px={0.25}
              >
                /
              </Text>
            )}
            <Box
              as="button"
              type="button"
              fontSize="2xs"
              fontFamily="mono"
              p="0"
              h="auto"
              minH={0}
              lineHeight="1.2"
              borderRadius="sm"
              color={
                isSelected ? "brand.500" : isHovered ? "fg.default" : "muted"
              }
              cursor="pointer"
              transition="color 0.12s"
              onClick={(e) => {
                if (e.detail >= 2) return;
                onSelect(index);
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                onPrune(index);
              }}
              onMouseEnter={() => onHover(index)}
            >
              {formatPathSegmentLabel(item)}
            </Box>
          </Fragment>
        );
      })}
    </HStack>
  );
};

export default ElementPathBreadcrumb;
