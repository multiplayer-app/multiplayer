import { EntityWithMeta } from "shared/models/interfaces";

import { IDebugSessionNode, ITraceNode } from "../../../../../types";
import TraceNodeName from "../TraceNodeName";
import HttpAttributes from "../HttpAttributes";

interface EndpointTraceProps {
  node: IDebugSessionNode<ITraceNode>;
  entity: EntityWithMeta;
}

const EndpointTrace = ({ node, entity }: EndpointTraceProps) => {
  const trace = node.meta;
  const serviceName = entity ? entity.key : trace.ServiceName;

  return (
    <>
      <TraceNodeName>{serviceName}</TraceNodeName>
      <HttpAttributes data={trace?.SpanAttributes} />
    </>
  );
};

export default EndpointTrace;
