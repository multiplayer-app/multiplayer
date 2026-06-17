import { useMemo } from "react";
import { Box, Flex } from "@chakra-ui/react";
import CheckAllPortal from "../components/CheckAllPortal";
import {
  DebugSessionNodeType,
  IDebugSessionNode,
  ILogNode,
} from "../../../DebugSession/types";
import { useDebugSession } from "../../../DebugSession/DebugSessionContext";
import { hasAnsi, stripAnsi } from "shared/utils";
import VirtualBox from "shared/components/VirtualBox";
import DebugSessionNode from "../components/DebugSessionNode";
import {
  doesNodeMatchQuery,
  isExceptionNode,
  isMostRelevantNode,
} from "pages/Workspace/Project/Debugger/DebugSession/utils";

interface OtelLogsProps {
  readonly: boolean;
}

const OtelLogs = ({ readonly }: OtelLogsProps) => {
  const { sessionNodes, filters, starredNodes } = useDebugSession();
  const data = sessionNodes[DebugSessionNodeType.Log];

  const logs = useMemo(() => {
    if (!data?.length) return [];

    let filtered = data;

    if (filters.mostRelevant) {
      filtered = filtered.filter((node) =>
        isMostRelevantNode(node, starredNodes)
      );
    }

    if (filters.starred) {
      filtered = filtered.filter((a: IDebugSessionNode<ILogNode>) => {
        return starredNodes.has(a.id);
      });
    }

    if (filters.showOnlyExceptions) {
      filtered = filtered.filter(isExceptionNode);
    }

    if (filters.level && filters.level.length > 0) {
      filtered = filtered.filter((a: IDebugSessionNode<ILogNode>) => {
        return filters.level.find(
          (l) =>
            l.value ===
            (hasAnsi(a.meta.SeverityText)
              ? stripAnsi(a.meta.SeverityText)
              : a.meta.SeverityText)
        );
      });
    }

    if (filters.component && filters.component.length > 0) {
      filtered = filtered.filter((a: IDebugSessionNode<ILogNode>) => {
        return filters.component.find((l) => l.value === a.meta.ServiceName);
      });
    }

    if (filters.search) {
      const searchQuery = filters.search.toLowerCase();
      filtered = filtered.filter((node) =>
        doesNodeMatchQuery(node, searchQuery)
      );
    }

    return filtered;
  }, [data, filters]);

  return (
    <Flex h="full" overflowX="auto" direction="column">
      {!readonly && <CheckAllPortal nodes={logs} />}
      {!logs?.length ? (
        <Flex fontStyle="italic" color="muted" p="4" m="auto">
          No logs are available for this session.
        </Flex>
      ) : (
        <Box overflowX="auto" h="full">
          <VirtualBox>
            {logs.map((node: IDebugSessionNode<ILogNode>) => (
              <DebugSessionNode key={node.id} node={node} readonly={readonly} />
            ))}
          </VirtualBox>
        </Box>
      )}
    </Flex>
  );
};

export default OtelLogs;
