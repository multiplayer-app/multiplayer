import { Box, Flex, FlexProps } from "@chakra-ui/react";
import { useState } from "react";

interface FlowTraceNodeProps<T> extends FlexProps {
  node: any;
  depth?: number;
}

const FlowTraceNode = <T,>({
  node,
  depth = 0,
  ...rest
}: FlowTraceNodeProps<T>) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <>
      <Flex
        role="group"
        minW="0"
        _hover={{ bg: "bg.surface" }}
        transition="all .2s cubic-bezier(.87, 0, .13, 1)"
      >
        <Flex
          py="2"
          px="4"
          gap="3"
          minW="0"
          flex="60%"
          alignItems="center"
          cursor="pointer"
          {...rest}
        >
          {/* <ViewsCheckbox node={node} /> */}
          {/* <StarToggleButton node={node} /> */}
          <DepthGap depth={depth} />
          <NodeContent node={node} />
        </Flex>
      </Flex>
    </>
  );
};

const NodeContent = ({ node }) => {
  return null;
};

const DepthGap = ({ depth }) => {
  return depth ? <Box minW={depth * 6} maxW={depth * 6} /> : null;
};

export default FlowTraceNode;
