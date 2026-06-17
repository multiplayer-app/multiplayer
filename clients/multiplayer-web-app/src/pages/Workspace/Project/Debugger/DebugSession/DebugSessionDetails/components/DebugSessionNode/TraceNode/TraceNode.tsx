import { Box } from "@chakra-ui/react";
import { OtelScope } from "@multiplayer/types";

import { useEntities } from "shared/providers/EntitiesContext";
import DebugNodeCollapseToggle from "shared/components/DebugNodeCollapseToggle";

import EndpointTrace from "./EndpointTrace";
import ExceptionTrace from "./ExceptionTrace";
import NavigationTrace from "./NavigationTrace";
import DocumentLoadTrace from "./DocumentLoadTrace";
import DebugSessionNodeIcon from "../DebugSessionNodeIcon";
import { ISessionNodeProps, ITraceNode } from "../../../../types";

const TraceNode = ({
  node,
  collapsable = true,
}: ISessionNodeProps<ITraceNode>) => {
  return (
    <>
      <DebugSessionNodeIcon node={node} />
      {collapsable && <DebugNodeCollapseToggle node={node} />}
      <TraceNodeContent node={node} />
    </>
  );
};

const TraceNodeContent = ({ node }: ISessionNodeProps<ITraceNode>) => {
  const { entityAliasesMap } = useEntities();
  const trace = node.meta;

  switch (trace.ScopeName) {
    case OtelScope.http:
    case OtelScope.fetch:
    case OtelScope.httpXmlRequest:
      return (
        <EndpointTrace
          node={node}
          entity={entityAliasesMap.get(trace.ServiceName)}
        />
      );
    case OtelScope.multiplayerNotebookHttp:
    case OtelScope.documentLoad:
      return <DocumentLoadTrace node={node} />;
    case OtelScope.navigation:
      return <NavigationTrace node={node} />;
    case OtelScope.exception:
      return <ExceptionTrace node={node} />;
    default:
      return (
        <>
          <Box overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
            {trace.SpanName}
          </Box>
        </>
      );
  }
};
export default TraceNode;
