import { useMemo } from "react";
import { Box, Flex } from "@chakra-ui/react";
import VirtualBox from "shared/components/VirtualBox";
import {
  ITraceNode,
  ITraceData,
  IDebugSessionNode,
  DebugSessionNodeType,
} from "../../types";
import {
  isExceptionNode,
  isMostRelevantNode,
  doesNodeMatchQuery,
} from "../../utils";
import { useDebugSession } from "../../DebugSessionContext";
import CheckAllPortal from "../components/CheckAllPortal";
import DebugSessionNode from "../components/DebugSessionNode";

interface OtelEventsProps {
  readonly: boolean;
}

const OtelEvents = ({ readonly }: OtelEventsProps) => {
  const { filters, sessionNodes, starredNodes } = useDebugSession();
  const data = sessionNodes[DebugSessionNodeType.Event];

  const events = useMemo(() => {
    let filtered = data;
    if (filters.mostRelevant) {
      filtered = filtered.filter((node) =>
        isMostRelevantNode(node, starredNodes)
      );
    }

    if (filters.starred) {
      filtered = data.filter((d: IDebugSessionNode<ITraceData>) =>
        starredNodes.has(d.id)
      );
    }
    if (filters.showOnlyExceptions) {
      filtered = filtered.filter(isExceptionNode);
    }
    if (filters.search) {
      const searchQuery = filters.search.toLowerCase();
      filtered = filtered.filter((node) =>
        doesNodeMatchQuery(node, searchQuery)
      );
    }
    return filtered;
  }, [data, starredNodes, filters]);

  return (
    <Flex flexDir="column" h="full">
      {!readonly && <CheckAllPortal nodes={events} />}
      {!events?.length ? (
        <Flex fontStyle="italic" color="muted" p={4} m="auto">
          No events are available for this session.
        </Flex>
      ) : (
        <Box overflowX="auto" h="full">
          <VirtualBox>
            {events.map((node: IDebugSessionNode<ITraceNode>) => (
              <DebugSessionNode key={node.id} node={node} readonly={readonly} />
            ))}
          </VirtualBox>
        </Box>
      )}
    </Flex>
  );
};

export default OtelEvents;
