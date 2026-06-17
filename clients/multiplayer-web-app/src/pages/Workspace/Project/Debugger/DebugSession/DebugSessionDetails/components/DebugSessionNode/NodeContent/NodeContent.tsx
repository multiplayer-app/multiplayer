import { Box } from "@chakra-ui/react";

import LogNode from "../LogNode";
import EventNode from "../EventNode";
import TraceNode from "../TraceNode";
import ConsoleNode from "../ConsoleNode";
import { DebugSessionNodeType, IDebugSessionNode } from "../../../../types";

interface NodeContentProps {
  node: IDebugSessionNode<any>;
  collapsable?: boolean;
}

const NodeContent = ({ node, collapsable = true }: NodeContentProps) => {
  switch (node.type) {
    case DebugSessionNodeType.Trace:
      return <TraceNode node={node} collapsable={collapsable} />;
    case DebugSessionNodeType.Event:
      return <EventNode node={node} collapsable={collapsable} />;
    case DebugSessionNodeType.Console:
      return <ConsoleNode node={node} collapsable={collapsable} />;
    case DebugSessionNodeType.Log:
      return <LogNode node={node} collapsable={collapsable} />;
    default:
      return <Box />;
  }
};

export default NodeContent;
