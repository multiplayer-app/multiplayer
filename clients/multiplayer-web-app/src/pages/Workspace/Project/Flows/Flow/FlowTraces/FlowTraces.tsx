import { Box, Flex } from "@chakra-ui/react";
import { useFlowLayout } from "../FlowLayoutContext";
import { useFlow } from "../FlowContext";
import { useMemo } from "react";

interface FlowTraces {}

const FlowTraces = ({}: FlowTraces) => {
  const { flow } = useFlow();
  const { tracesWrapper, tracesContainer } = useFlowLayout();

  const traces = useMemo(() => {}, [flow]);

  return (
    <Flex
      ref={tracesWrapper}
      minW="0"
      w="full"
      flex="1"
      direction="column"
      border="solid 1px"
      borderRadius="lg"
      borderColor="border.primary"
    >
      <Flex
        p="3"
        gap="4"
        alignItems="center"
        borderBottom="solid 1px"
        borderColor="border.primary"
      >
        <Box flex="1">Flow traces</Box>
        <Box flex="1" />
      </Flex>
      <Flex
        flex="1"
        minH="0"
        borderTop="solid 1px"
        borderColor="border.primary"
        justifyContent="center"
        ref={tracesContainer}
      ></Flex>
    </Flex>
  );
};

export default FlowTraces;
