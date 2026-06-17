import { ReactNode, useState } from "react";
import { Flex, Text, Box, FlexProps } from "@chakra-ui/react";

import { ComponentType } from "@multiplayer/types";
import NodeIcon from "shared/components/NodeIcon";

const IconBoxes = [
  {
    zIndex: 1,
    top: "2px",
    left: "5px",
    topHovered: "10px",
    leftHovered: "38px",
    rotate: "4deg",
    iconType: ComponentType.CLIENT,
  },
  {
    zIndex: 0,
    top: "7px",
    left: "-3px",
    topHovered: "11px",
    leftHovered: "-37px",
    rotate: "-6deg",
    iconType: ComponentType.GENERIC,
  },
  {
    zIndex: 2,
    top: 0,
    left: 0,
    topHovered: 0,
    leftHovered: 0,
    rotateBefore: 0,
    rotateAfter: 0,
    iconType: ComponentType.PLATFORM,
  },
];

const EntityEmptyView = ({
  title,
  children,
  description,
  ...props
}: FlexProps & {
  title: string;
  children?: ReactNode;
  description?: string;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      h="full"
      w="full"
      p="4"
      {...props}
    >
      <Flex
        px="12"
        py="16"
        flexDir="column"
        alignItems="center"
        textAlign="center"
        bg="bg.subtle"
        border="1px solid"
        borderColor="border.secondary"
        borderRadius="2xl"
        w="full"
        maxW="480px"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Box
          position="relative"
          className="icon-boxes-wrapper"
          width="12"
          height="12"
          mb="44px"
        >
          {IconBoxes.map((boxData, index) => {
            const {
              top,
              left,
              topHovered,
              leftHovered,
              zIndex,
              rotate,
              iconType,
            } = boxData;
            return (
              <Flex
                key={index}
                alignItems="center"
                justifyContent="center"
                position="absolute"
                backgroundColor="bg.primary"
                border="1px solid #F3F4F6"
                boxShadow="0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)"
                borderRadius="xl"
                width="12"
                height="12"
                top={hovered ? topHovered : top}
                left={hovered ? leftHovered : left}
                zIndex={zIndex}
                transform={`rotate(${rotate})`}
                transition="all .3s cubic-bezier(.87, 0, .13, 1)"
              >
                <NodeIcon type={iconType} boxSize="6" color="muted" />
              </Flex>
            );
          })}
        </Box>
        <Text mb="2" fontSize="md" fontWeight="medium">
          {title}
        </Text>
        {description && (
          <Text color="muted" fontWeight="medium">
            {description}
          </Text>
        )}
        {children}
      </Flex>
    </Flex>
  );
};

export default EntityEmptyView;
