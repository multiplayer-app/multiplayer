import { Box, Text } from "@chakra-ui/react";
import { logLevelColorMap } from "pages/Workspace/Project/Debugger/DebugSession/DebugSession.configs";
import { useMemo } from "react";
import { TerminalIcon } from "shared/icons";
import ConsoleTraces from "../ConsoleTraces";
import MonoText from "../MonoText";
import Payloads from "../Payloads";
import { IConsoleNode } from "pages/Workspace/Project/Debugger/DebugSession/types";

interface ConsoleNodeDetailsProps {
  meta: IConsoleNode;
}

const ConsoleNodeDetails = ({ meta }: ConsoleNodeDetailsProps) => {
  const attributes = useMemo(() => {
    const { data } = meta || {};
    const { payload, trace, level } = data?.payload || {};

    return {
      payload,
      trace,
      icon: TerminalIcon,
      color: logLevelColorMap[level] || logLevelColorMap.log,
    };
  }, [meta]);

  const { payload, trace } = attributes || {};

  if (!payload) {
    return null;
  }

  return (
    <Box py={4} overflow="auto" userSelect="text">
      <Text color="muted" fontWeight="medium" mb={2}>
        Message:
      </Text>
      <MonoText
        p="2"
        as="div"
        fontSize="xs"
        border="solid 1px"
        borderColor="border.primary"
        color="body"
        borderRadius="base"
      >
        <Payloads data={payload} />
      </MonoText>
      <Text color="muted" fontWeight="medium" mb={2} mt={4}>
        Stack trace:
      </Text>
      <MonoText
        as="div"
        p="2"
        fontSize="xs"
        border="solid 1px"
        borderColor="border.primary"
        color="body"
        borderRadius="base"
      >
        <ConsoleTraces data={trace} />
      </MonoText>
    </Box>
  );
};

export default ConsoleNodeDetails;
