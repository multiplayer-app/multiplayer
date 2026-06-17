import { Box, Flex } from "@chakra-ui/react";
import { ComponentType } from "@multiplayer/types";
import { EntityInstance } from "shared/models/interfaces";
import NodeIcon from "shared/components/NodeIcon";

const ComponentListItem = ({
  component,
  onClick,
}: {
  component: EntityInstance;
  onClick: (cId: string) => void;
}) => {
  const itemBackgroundByType = () => {
    return {
      [ComponentType.GENERIC]: {
        background: "#EBF8FF",
        color: "#2D3748",
      },
      [ComponentType.CLIENT]: {
        background: "#2D3748",
        color: "#EDF2F7",
      },
      [ComponentType.SERVICE]: {
        background: "#C6F6D5",
        color: "#276749",
      },
      [ComponentType.PLATFORM]: {
        background: "#FAF5FF",
        color: "#2D3748",
      },
    };
  };

  return (
    <Flex
      w="100%"
      pl="4"
      pr="2"
      gap="4"
      minH="14"
      cursor="pointer"
      borderWidth="1px"
      borderRadius="xl"
      alignItems="center"
      style={{
        ...itemBackgroundByType()[component.meta?.summary?.type || "generic"],
      }}
      onClick={() => {
        onClick(component.entityId);
      }}
    >
      <NodeIcon type={component.meta?.summary?.type || "generic"} />
      <Box flex="1">{component.key}</Box>
    </Flex>
  );
};

export default ComponentListItem;
