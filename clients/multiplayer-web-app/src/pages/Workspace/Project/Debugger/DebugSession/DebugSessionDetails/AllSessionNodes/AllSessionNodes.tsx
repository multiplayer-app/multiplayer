import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useMemo, useRef } from "react";
import CheckAllPortal from "../components/CheckAllPortal";

import { useDebugSession } from "../../DebugSessionContext";
import DebugSessionNode from "../components/DebugSessionNode";
import TimelineHeader from "../components/TimelineHeader";
import { DebugSessionNodeType, IDebugSessionNode } from "../../types";
import OtelTracesTimeline from "../../DebugSessionDetails/OtelTraces/OtelTracesTimeline";
import { useDebugSessionLayout } from "../../DebugSessionLayoutContext";
import {
  getNodeStatus,
  isExceptionNode,
  doesNodeMatchQuery,
  collectAllSessionNodes,
  filterNodeTreeWithMostRelevant,
  filterNodeTreeWithMatchingDescendants,
} from "../../utils";
import VirtualBox from "shared/components/VirtualBox";
import { hasAnsi, stripAnsi } from "shared/utils";
import { VirtualBoxHandle } from "shared/models/interfaces";
import Visibility from "shared/components/Visibility";

const AllSessionNodes = ({ readonly }: { readonly: boolean }) => {
  const {
    filters,
    starredNodes,
    sessionNodes,
    selectedError,
    setSelectedError,
  } = useDebugSession();

  const { configs } = useDebugSessionLayout();
  const virtualBoxRef = useRef<VirtualBoxHandle>(null);

  const componentFilterSet = useMemo(() => {
    if (!filters.component?.length) return null;
    return new Set(filters.component.map((l) => l.value));
  }, [filters.component]);

  const allSessionNodesFiltered = useMemo(() => {
    const typeSet = new Set(filters.type.map((t) => t.value));

    const allNodes = Object.values(sessionNodes)
      .flat()
      .reduce<IDebugSessionNode<any>[]>((acc, node) => {
        if (typeSet.size > 0 && !typeSet.has(node.type)) {
          return acc;
        }
        if (filters.starred) {
          const filteredNode = filterNodeByStarred(node, true, starredNodes);
          if (filteredNode) {
            acc.push(filteredNode);
          }
        } else {
          acc.push(node);
        }
        return acc;
      }, []);

    let filteredNodes = allNodes;

    if (filters.mostRelevant) {
      filteredNodes = filteredNodes
        .map((node) => filterNodeTreeWithMostRelevant(node, starredNodes))
        .filter((n): n is IDebugSessionNode<any> => !!n);
    }

    if (filters.showOnlyExceptions) {
      filteredNodes = filteredNodes.filter(isExceptionNode);
    }

    if (filters.level && filters.level.length > 0) {
      filteredNodes = filteredNodes.filter((a: IDebugSessionNode<any>) => {
        return filters.level.find(
          (l) =>
            l.value ===
            (hasAnsi(a.meta.SeverityText)
              ? stripAnsi(a.meta.SeverityText)
              : a.meta.SeverityText)
        );
      });
    }

    if (componentFilterSet) {
      filteredNodes = filteredNodes
        .map((node) =>
          filterNodeTreeWithMatchingDescendants(node, componentFilterSet)
        )
        .filter(Boolean);
    }

    if (filters.status && filters.status.length > 0) {
      filteredNodes = filteredNodes.filter((a: IDebugSessionNode<any>) => {
        if (a.type !== DebugSessionNodeType.Trace) {
          return;
        }

        const { statusCode, statusText } = getNodeStatus(a) || {};

        return filters.status.find(
          (l) => l.value === `${statusCode} ${statusText}`
        );
      });
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

      filteredNodes = filteredNodes
        .map(filterRecursively)
        .filter((n): n is IDebugSessionNode<any> => !!n);
    }

    return collectAllSessionNodes(filteredNodes);
  }, [sessionNodes, starredNodes, filters]);

  useEffect(() => {
    if (selectedError?.id) {
      const index = allSessionNodesFiltered.findIndex(
        (n) => n.id === selectedError.id
      );

      if (index !== -1) {
        virtualBoxRef?.current?.scrollToIndex(index, { align: "start" });
        setSelectedError(null);
      }
    }
  }, [selectedError, allSessionNodesFiltered]);

  return (
    <Flex h="full" overflowX="auto" direction="column">
      {!readonly && <CheckAllPortal nodes={allSessionNodesFiltered} />}
      {configs.tracesTimeline && (
        <Visibility hideBelow="md">
          <OtelTracesTimeline />
        </Visibility>
      )}
      <Box>
        {configs.waterfall && (
          <Visibility hideBelow="md">
            <TimelineHeader />
          </Visibility>
        )}
        {!allSessionNodesFiltered?.length ? (
          <Flex
            p="4"
            m="auto"
            color="muted"
            fontStyle="italic"
            justifyContent="center"
          >
            {`No data is available
            ${
              !!filters.starred || !!filters.type.length
                ? "matching selected filters"
                : "for this session"
            }.`}
          </Flex>
        ) : (
          <VirtualBox ref={virtualBoxRef}>
            {allSessionNodesFiltered?.map((node) => (
              <DebugSessionNode key={node.id} node={node} readonly={readonly} />
            ))}
          </VirtualBox>
        )}
      </Box>
    </Flex>
  );
};

const filterNodeByStarred = (
  node: IDebugSessionNode<any>,
  starred: boolean,
  starSet: Set<string>
): IDebugSessionNode<any> | null => {
  const isStarred = starSet.has(node.id);
  const filteredChildren = node.childSpans
    ? node.childSpans.reduce<IDebugSessionNode<any>[]>((acc, child) => {
        const filteredChild = filterNodeByStarred(child, starred, starSet);
        if (filteredChild) acc.push(filteredChild);
        return acc;
      }, [])
    : [];

  if (starred) {
    if (isStarred || filteredChildren.length > 0) {
      return {
        ...node,
        childSpans: isStarred ? node.childSpans : filteredChildren,
      };
    }
  } else {
    if (!isStarred) {
      return {
        ...node,
        childSpans: filteredChildren,
      };
    }
  }

  return null;
};

export default AllSessionNodes;
