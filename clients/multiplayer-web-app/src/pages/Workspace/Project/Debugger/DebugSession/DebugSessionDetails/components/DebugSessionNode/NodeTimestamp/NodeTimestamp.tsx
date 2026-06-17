import MonoText from "shared/components/MonoText";
import { getFormattedTime } from "../../../../utils";
import { useDebugSession } from "../../../../DebugSessionContext";
import { Box, Tooltip } from "@chakra-ui/react";

interface NodeTimestampProps {
  timestamp: number;
}

const NodeTimestamp = ({ timestamp }: NodeTimestampProps) => {
  const { session } = useDebugSession();

  return (
    <MonoText>
      <Tooltip
        openDelay={1000}
        label={new Date(timestamp).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        })}
      >
        <Box as="span">{getFormattedTime(session.startedAt, timestamp)}</Box>
      </Tooltip>
    </MonoText>
  );
};

export default NodeTimestamp;
