import { Flex } from "@chakra-ui/react";
import OtelTracesList from "./OtelTracesList";
import OtelTracesTimeline from "./OtelTracesTimeline";
import { useDebugSessionLayout } from "../../DebugSessionLayoutContext";

interface OtelTracesProps {
  readonly: boolean;
}

const OtelTraces = ({ readonly }: OtelTracesProps) => {
  const { configs } = useDebugSessionLayout();
  return (
    <Flex h="full" overflowX="auto" direction="column">
      {configs.tracesTimeline && <OtelTracesTimeline />}
      <OtelTracesList readonly={readonly} />
    </Flex>
  );
};

export default OtelTraces;
