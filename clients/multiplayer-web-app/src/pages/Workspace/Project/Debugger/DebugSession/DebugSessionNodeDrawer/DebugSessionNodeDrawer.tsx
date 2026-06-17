import { Box, Flex, Icon, Text, Tooltip } from "@chakra-ui/react";

import { ClipboardCopyIcon } from "shared/icons";
import useMessage from "shared/hooks/useMessage";
import { useEntities } from "shared/providers/EntitiesContext";
import Drawer, { DrawerContent } from "shared/components/Drawer";
import { toCapitalize } from "shared/utils";

import Duration from "shared/components/Duration";
import HttpAttributes from "../DebugSessionDetails/components/DebugSessionNode/TraceNode/HttpAttributes";
import { DebugSessionNodeType } from "../types";

import { useDebugSession } from "../DebugSessionContext";
import ConsoleNodeDetails from "shared/components/ConsoleNodeDetails";
import TraceNodeDetails from "shared/components/TraceNodeDetails";
import DebugSessionNodeIcon from "../DebugSessionDetails/components/DebugSessionNode/DebugSessionNodeIcon";

const DebugSessionNodeDrawer = () => {
  const { nodeDetailsDrawerDisclosure, selectedNode, setSelectedNode } =
    useDebugSession();

  const onDrawerClose = () => {
    setSelectedNode(null);
    nodeDetailsDrawerDisclosure.onClose();
  };
  return (
    <Drawer isOpen={!!setSelectedNode}>
      <DrawerContent height="auto" onClose={onDrawerClose}>
        {selectedNode && <DebugSessionNodeDetails node={selectedNode} />}
      </DrawerContent>
    </Drawer>
  );
};

const DebugSessionNodeDetails = ({ node }) => {
  // TODO rename this to TraceDetails and create a component for each type
  const { entityAliasesMap } = useEntities();

  const entity = entityAliasesMap.get(node.meta?.ServiceName);

  return (
    <Flex direction="column" gap="6" p="4" flex="1" overflow="hidden">
      <Flex alignItems="center">
        <DebugSessionNodeIcon
          mr="3"
          node={node}
          boxSize="48px"
          borderRadius="lg"
        />
        <Flex direction="column">
          <Flex fontSize="md" fontWeight="semibold" alignItems="center">
            <Box>
              {node.type === DebugSessionNodeType.Console
                ? `Console ${node.meta?.data?.payload?.message || "Event"}`
                : node.meta?.ServiceName}
            </Box>
          </Flex>
          {entity && (
            <Box color="muted" fontSize="sm" fontWeight="500">
              {entity?.metadata?.type
                ? toCapitalize(entity.metadata.type)
                : "Component"}
            </Box>
          )}
        </Flex>
      </Flex>
      <Flex direction="column" gap="2">
        {node.meta?.TraceId && (
          <MetaIDDisplay label="Trace ID" value={node.meta?.TraceId} />
        )}
        {node.meta?.SpanId && (
          <MetaIDDisplay label="Span ID" value={node.meta?.SpanId} />
        )}
        <Flex gap="2" alignItems="center">
          <Flex
            px="2"
            py="1"
            fontSize="xs"
            fontWeight="500"
            border="1px solid"
            borderRadius="4px"
            borderColor="blackAlpha.100"
          >
            {new Date(node.timestamp).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "2-digit",
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })}
          </Flex>
          <Duration data={node.meta.Duration} />
        </Flex>
        <HttpAttributes data={node.meta.SpanAttributes} />
      </Flex>
      {node.type === DebugSessionNodeType.Console ? (
        <ConsoleNodeDetails meta={node.meta} />
      ) : (
        <TraceNodeDetails type={node.type} meta={node.meta} />
      )}
    </Flex>
  );
};

export default DebugSessionNodeDrawer;

const MetaIDDisplay = ({ label, value }) => {
  const message = useMessage();
  if (!value) return null;

  const onCopyID = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(value);
      message.success(`${label} successfully copied!`);
    } catch (error) {
      message.handleError({ message: "Something went wrong!" });
    }
  };

  return (
    <Box as="span">
      <Text as="span" display="inline-block" fontWeight="500" mr={4} w="60px">
        {label}
      </Text>
      <Text as="span" color="muted" fontSize="sm" mr={1}>
        {value}
      </Text>
      <Tooltip label={`Copy ${label}`}>
        <Icon
          cursor="pointer"
          boxSize="4"
          verticalAlign="text-top"
          onClick={onCopyID}
          as={ClipboardCopyIcon}
        />
      </Tooltip>
    </Box>
  );
};
