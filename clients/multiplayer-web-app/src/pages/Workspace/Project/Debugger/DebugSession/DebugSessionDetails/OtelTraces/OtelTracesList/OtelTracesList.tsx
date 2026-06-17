import { useMemo } from "react";
import { Box, Flex } from "@chakra-ui/react";
import VirtualBox from "shared/components/VirtualBox";
import {
  ITraceNode,
  IDebugSessionNode,
  DebugSessionNodeType,
} from "../../../types";
import CheckAllPortal from "../../components/CheckAllPortal";
import DebugSessionNode from "../../components/DebugSessionNode";
import { useDebugSession } from "../../../DebugSessionContext";
import {
  getNodeStatus,
  isExceptionNode,
  doesNodeMatchQuery,
  filterNodeTreeWithMostRelevant,
  filterNodeTreeWithMatchingDescendants,
} from "../../../utils";

interface OtelTracesListProps {
  readonly: boolean;
}

const OtelTracesList = ({ readonly }: OtelTracesListProps) => {
  const { sessionNodes, starredNodes, filters } = useDebugSession();
  const data = sessionNodes[DebugSessionNodeType.Trace];

  const componentFilterSet = useMemo(() => {
    if (!filters.component?.length) return null;
    return new Set(filters.component.map((l) => l.value));
  }, [filters.component]);

  const statusFilterSet = useMemo(() => {
    if (!filters.status?.length) return null;
    return new Set(filters.status.map((l) => l.value));
  }, [filters.status]);

  const traces = useMemo(() => {
    if (!data?.length) return [];

    let filtered = data;

    if (filters.mostRelevant) {
      filtered = filtered
        .map((node) => filterNodeTreeWithMostRelevant(node, starredNodes))
        .filter((n): n is IDebugSessionNode<any> => !!n);
    }

    if (filters.starred) {
      filtered = filtered.filter((node) => starredNodes.has(node.id));
    }

    if (filters.showOnlyExceptions) {
      filtered = filtered.filter(isExceptionNode);
    }

    if (componentFilterSet) {
      filtered = filtered
        .map((node) =>
          filterNodeTreeWithMatchingDescendants(node, componentFilterSet)
        )
        .filter(Boolean);
    }

    if (filters.search) {
      const searchQuery = filters.search.toLowerCase();

      const filterRecursively = (
        node: IDebugSessionNode<any>
      ): IDebugSessionNode<any> | null => {
        const nodeMatches = doesNodeMatchQuery(node, searchQuery);

        if (nodeMatches) {
          return node;
        }

        const filteredChildren = (node.childSpans || []).reduce<
          IDebugSessionNode<any>[]
        >((acc, child) => {
          const filteredChild = filterRecursively(child);
          if (filteredChild) {
            acc.push(filteredChild);
          }
          return acc;
        }, []);

        if (filteredChildren.length > 0) {
          return { ...node, childSpans: filteredChildren };
        }

        return null;
      };

      filtered = filtered
        .map(filterRecursively)
        .filter((n): n is IDebugSessionNode<any> => !!n);
    }

    if (statusFilterSet) {
      filtered = filtered.filter((node: IDebugSessionNode<ITraceNode>) => {
        const { statusCode, statusText } = getNodeStatus(node) || {};

        return statusFilterSet.has(`${statusCode} ${statusText}`);
      });
    }

    return filtered;
  }, [data, filters, starredNodes, componentFilterSet, statusFilterSet]);

  return (
    <>
      {!readonly && <CheckAllPortal nodes={traces} />}
      {!traces?.length ? (
        <Flex fontStyle="italic" color="muted" p="4" m="auto">
          No traces are available for this session.
        </Flex>
      ) : (
        <Box>
          <VirtualBox>
            {traces.map((node: IDebugSessionNode<ITraceNode>) => (
              <DebugSessionNode key={node.id} node={node} readonly={readonly} />
            ))}
          </VirtualBox>
        </Box>
      )}
    </>
  );
};

export default OtelTracesList;
