import { Tag } from "@chakra-ui/react";
import { AgentStatus, ChatType } from "@multiplayer-app/ai-agent-react";

type StatusColorConfig = {
  bg: string;
  color: string;
  _dark?: { bg: string; color: string };
};

export const SESSION_STATUS_LABELS: Record<AgentStatus, string> = {
  [AgentStatus.Processing]: "Processing",
  [AgentStatus.Streaming]: "Streaming",
  [AgentStatus.Finished]: "Finished",
  [AgentStatus.Aborted]: "Aborted",
  [AgentStatus.WaitingForUserAction]: "Waiting for user action",
  [AgentStatus.Error]: "Error",
  [AgentStatus.Timedout]: "Timedout",
};

export const SESSION_STATUS_COLORS: Record<AgentStatus, StatusColorConfig> = {
  [AgentStatus.Processing]: {
    bg: "yellow.50",
    color: "yellow.800",
    _dark: { bg: "yellow.900", color: "yellow.100" },
  },
  [AgentStatus.Streaming]: {
    bg: "green.50",
    color: "green.800",
    _dark: { bg: "green.900", color: "green.100" },
  },
  [AgentStatus.Finished]: {
    bg: "cyan.50",
    color: "cyan.800",
    _dark: { bg: "cyan.800", color: "cyan.100" },
  },
  [AgentStatus.Aborted]: {
    bg: "orange.50",
    color: "orange.800",
    _dark: { bg: "orange.900", color: "orange.100" },
  },
  [AgentStatus.WaitingForUserAction]: {
    bg: "blue.50",
    color: "blue.800",
    _dark: { bg: "blue.900", color: "blue.100" },
  },
  [AgentStatus.Error]: {
    bg: "red.50",
    color: "red.800",
    _dark: { bg: "red.900", color: "red.100" },
  },
  [AgentStatus.Timedout]: {
    bg: "red.50",
    color: "red.800",
    _dark: { bg: "red.900", color: "red.100" },
  },
};

type TypeColorConfig = {
  bg: string;
  color: string;
  _dark?: { bg: string; color: string };
};

export const SESSION_TYPE_COLORS: Record<ChatType, TypeColorConfig> = {
  [ChatType.Chat]: {
    bg: "purple.50",
    color: "purple.800",
    _dark: { bg: "purple.900", color: "purple.100" },
  },
  [ChatType.Agent]: {
    bg: "brand.50",
    color: "brand.700",
    _dark: { bg: "brand.900", color: "brand.100" },
  },
};

type StatusValue = AgentStatus | string | null | undefined;

export const SessionStatusTag = ({ status }: { status: StatusValue }) => {
  const fallback = AgentStatus.Finished;
  const key = (status ?? fallback) as AgentStatus;
  const colors = SESSION_STATUS_COLORS[key] ?? SESSION_STATUS_COLORS[fallback];
  const label = SESSION_STATUS_LABELS[key] ?? String(status ?? fallback);

  return (
    <Tag
      size="sm"
      variant="subtle"
      borderRadius="md"
      bg={colors.bg}
      textTransform="capitalize"
      color={colors.color}
      _dark={colors._dark}
    >
      {label}
    </Tag>
  );
};

type TypeValue = ChatType | string | null | undefined;

export const SessionTypeTag = ({ type }: { type: TypeValue }) => {
  const fallback = ChatType.Chat;
  const key = (type ?? fallback) as ChatType;
  const colors = SESSION_TYPE_COLORS[key] ?? SESSION_TYPE_COLORS[fallback];

  return (
    <Tag
      size="sm"
      variant="subtle"
      borderRadius="md"
      bg={colors.bg}
      textTransform="capitalize"
      color={colors.color}
      _dark={colors._dark}
    >
      {type ?? fallback}
    </Tag>
  );
};
