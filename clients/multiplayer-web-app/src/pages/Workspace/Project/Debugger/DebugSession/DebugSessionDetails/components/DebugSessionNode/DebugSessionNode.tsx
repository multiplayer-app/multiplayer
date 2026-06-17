import { useRef, forwardRef, useEffect } from "react";
import { Box, Flex, Collapse, FlexProps } from "@chakra-ui/react";

import NodeNote, { NodeNoteToggleButton } from "./NodeNote";
import NodeContent from "./NodeContent";
import NodeTimeline from "./NodeTimeline";
import NodeTimestamp from "./NodeTimestamp";

import Duration from "shared/components/Duration";
import ViewsCheckbox from "../ViewsCheckbox";
import NodeAddButton from "../../../attachments/NodeAddButton";

import { IDebugSessionNode, DebugSessionNodeType } from "../../../types";
import { useDebugSession } from "../../../DebugSessionContext";
import { useDebugSessionLayout } from "../../../DebugSessionLayoutContext";

interface DebugSessionNodeProps<T> extends FlexProps {
  node: IDebugSessionNode<T>;
  depth?: number;
  readonly: boolean;
}

const DebugSessionNode = forwardRef(
  ({ node, depth = 0, readonly, ...rest }: DebugSessionNodeProps<any>, ref) => {
    const { configs } = useDebugSessionLayout();

    const nodeRef = useRef<HTMLDivElement>();
    const {
      scrollTarget,
      sessionTime,
      selectedNode,
      expandedNotes,
      expandedNodes,
      toggleNoteExpanded,
      setSelectedNode,
      isNodeExpanded,
      setCustomSeekTime,
      nodeDetailsDrawerDisclosure,
    } = useDebugSession();

    const expanded = isNodeExpanded(node.id);

    useEffect(() => {
      let timeout: NodeJS.Timeout;
      if (scrollTarget.current === node.id) {
        timeout = setTimeout(() => {
          scrollTarget.current = null;
          nodeRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 600);
      }
      return () => clearTimeout(timeout);
    }, [expanded, expandedNodes]);

    const onNodeClick = (e) => {
      e.stopPropagation();
      setSelectedNode(node as any);
      if (!nodeDetailsDrawerDisclosure.isOpen) {
        nodeDetailsDrawerDisclosure.onOpen();
      }
      setCustomSeekTime(node.timestamp - sessionTime.start);
    };

    const minW = configs.waterfall ? "800px" : "500px";
    const noteExpanded = expandedNotes.has(node.id);

    const httpStatusCode =
      (node?.meta as any)?.SpanAttributes?.["http.status_code"] ||
      (node?.meta as any)?.SpanAttributes?.["http.response.status_code"];
    return (
      <>
        <Flex
          minW={minW}
          ref={nodeRef}
          role="group"
          transition="all .2s cubic-bezier(.87, 0, .13, 1)"
          bg={
            selectedNode?.id === node.id
              ? "bg.subtle"
              : noteExpanded
              ? "bg.surface"
              : scrollTarget.current === node.id
              ? "#eee8fe94"
              : "bg.primary"
          }
          _hover={{
            ...(selectedNode?.id !== node.id && { bg: "bg.surface" }),
          }}
        >
          <Flex
            py="0"
            minH="9"
            px="2"
            gap="2"
            flexGrow={1}
            flexBasis="60%"
            minW="0"
            minWidth="500px"
            cursor="pointer"
            alignItems="center"
            position="relative"
            overflow="hidden"
            w={!configs.waterfall || !!selectedNode ? "100%" : "60%"}
            onClick={onNodeClick}
            {...rest}
          >
            {node.hasError && (
              <Box
                w="3px"
                bg="red.400"
                borderRightRadius="2px"
                position="absolute"
                left="0"
                top="1.5"
                bottom="1.5"
              />
            )}
            {!readonly && <ViewsCheckbox node={node} />}
            <NodeNoteToggleButton
              node={node}
              expanded={noteExpanded}
              onToggle={() => toggleNoteExpanded(node.id)}
            />
            <NodeTimestamp timestamp={node.timestamp} />
            <DepthGap depth={depth} />
            <NodeContent node={node} />
            <Duration data={node.duration} />
            <NodeAddButton node={node} />
          </Flex>
          <NodeTimeline node={node} />
        </Flex>
        <NodeNote
          node={node}
          minW={minW}
          readonly={readonly}
          expanded={noteExpanded}
        />
        {!!node.childSpans.length && (
          <ChildNodes
            node={node}
            minW={minW}
            depth={depth}
            readonly={readonly}
            expanded={expanded}
          />
        )}
      </>
    );
  }
);

const ChildNodes = ({ node, expanded, minW, depth, readonly }) => {
  if (!node.childSpans.length && node.type !== DebugSessionNodeType.Log) {
    return <></>;
  }
  return (
    <Flex as={Collapse} in={expanded} unmountOnExit={true} minW={minW}>
      {node.childSpans.map((n, i) => (
        <DebugSessionNode
          key={i}
          node={n}
          depth={depth + 1}
          readonly={readonly}
        />
      ))}
    </Flex>
  );
};

const DepthGap = ({ depth }) => {
  const w = depth * 6 + (depth - 1) * 2;
  return depth ? <Box minW={w * 4 + "px"} maxW={w * 4 + "px"} /> : null;
};

export default DebugSessionNode;
