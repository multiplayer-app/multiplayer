import TraceNodeName from "../TraceNodeName";
import HttpAttributes from "../HttpAttributes";
import { IDebugSessionNode, ITraceNode } from "../../../../../types";

interface DocumentLoadTraceProps {
  node: IDebugSessionNode<ITraceNode>;
}

const DocumentLoadTrace = ({ node }: DocumentLoadTraceProps) => {
  const trace = node.meta;
  return (
    <>
      <TraceNodeName>{splitAndCapitalize(trace.SpanName)}</TraceNodeName>
      <HttpAttributes data={trace.SpanAttributes} />
    </>
  );
};

function splitAndCapitalize(str) {
  const words = str
    .split(/(?=[A-Z])/)
    .join(" ")
    .toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default DocumentLoadTrace;
