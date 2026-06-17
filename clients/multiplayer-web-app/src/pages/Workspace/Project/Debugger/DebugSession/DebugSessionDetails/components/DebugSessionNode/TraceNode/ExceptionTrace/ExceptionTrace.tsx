import TraceNodeName from "../TraceNodeName";
import { IDebugSessionNode, ITraceNode } from "../../../../../types";

interface ExceptionTraceProps {
  node: IDebugSessionNode<ITraceNode>;
  collapsable?: boolean;
}

const ExceptionTrace = ({ node, collapsable = true }: ExceptionTraceProps) => {
  const trace = node.meta;
  const exceptionType = trace.SpanName;
  const exceptionMessage = trace.StatusMessage;
  const title = `${exceptionType}: ${exceptionMessage}`;
  return (
    <>
      <TraceNodeName flex="0 1 auto" noOfLines={1} maxW="100%" title={title}>
        {title}
      </TraceNodeName>
    </>
  );
};

export default ExceptionTrace;
