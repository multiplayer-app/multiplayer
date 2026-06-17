import TraceNodeName from "../TraceNodeName";
import { IDebugSessionNode, ITraceNode } from "../../../../../types";
import MonoText from "shared/components/MonoText";

interface NavigationTraceProps {
  node: IDebugSessionNode<ITraceNode>;
}

const NavigationTrace = ({ node }: NavigationTraceProps) => {
  const trace = node.meta;
  const title =
    trace.SpanAttributes["navigation.metadata.friendlyRouteName"] ||
    trace.SpanAttributes["navigation.route_name"];
  return (
    <>
      <TraceNodeName>Navigated to</TraceNodeName>
      <MonoText
        borderRadius="base"
        border="1px solid"
        borderColor="border.primary"
        flex="0 1 auto"
        noOfLines={1}
        minW="0"
        px="1"
        title={title}
      >
        {title}
      </MonoText>
    </>
  );
};

export default NavigationTrace;
