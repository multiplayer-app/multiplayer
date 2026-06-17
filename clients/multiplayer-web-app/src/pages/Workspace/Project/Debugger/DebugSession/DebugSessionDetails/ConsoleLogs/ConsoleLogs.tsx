import { useMemo, useRef } from "react";
import { Box, Flex } from "@chakra-ui/react";
import {
  DebugSessionNodeType,
  IConsoleNode,
  IDebugSessionNode,
} from "../../types";

import VirtualBox from "shared/components/VirtualBox";
import {
  isExceptionNode,
  isMostRelevantNode,
  doesNodeMatchQuery,
} from "../../utils";
import { useDebugSession } from "../../DebugSessionContext";
import CheckAllPortal from "../components/CheckAllPortal";
import DebugSessionNode from "../components/DebugSessionNode";

interface ConsoleLogsProps {
  readonly: boolean;
}

const ConsoleLogs = ({ readonly }: ConsoleLogsProps) => {
  const scrollParent = useRef();
  const { filters, sessionNodes, starredNodes } = useDebugSession();
  const data = sessionNodes[DebugSessionNodeType.Console];

  const consoleLogs = useMemo(() => {
    let filtered = data;
    if (filters.mostRelevant) {
      filtered = filtered.filter((node) =>
        isMostRelevantNode(node, starredNodes)
      );
    }

    if (filters.starred) {
      filtered = data.filter((d: IDebugSessionNode<IConsoleNode>) =>
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
    <Flex direction="column" h="full">
      <CheckAllPortal nodes={consoleLogs} />
      {!consoleLogs?.length ? (
        <Flex fontStyle="italic" color="muted" p="4" m="auto">
          No console logs are available for this session.
        </Flex>
      ) : (
        <Box overflowX="auto" h="full" ref={scrollParent}>
          <VirtualBox scrollParent={scrollParent.current}>
            {consoleLogs.map((node: IDebugSessionNode<IConsoleNode>) => (
              <DebugSessionNode key={node.id} node={node} readonly={readonly} />
            ))}
          </VirtualBox>
        </Box>
      )}
    </Flex>
  );
};

export default ConsoleLogs;
