import {
  AgentFeatureFlags,
  AgentThemeTokens,
  ContextKeyConfig,
} from "@multiplayer-app/ai-agent-react";
import { AgentStatus, AgentType } from "@multiplayer/types";
import { MultipSelectOption } from "shared/models/interfaces";

export interface IAgentsFilters {
  skip: number;
  limit: number;
  sortKey: string;
  sortDirection: "1" | "-1";
  type: { label: string; value: string }[];
  status: { label: string; value: string }[];
}

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  [AgentType.CODING]: "Coding",
  [AgentType.DEBUGGING]: "Debugging",
};

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  [AgentStatus.IDLE]: "Idle",
  [AgentStatus.RUNNING]: "Running",
};

export const AGENT_TYPE_OPTIONS: MultipSelectOption[] = [
  { label: AGENT_TYPE_LABELS[AgentType.CODING], value: AgentType.CODING },
  { label: AGENT_TYPE_LABELS[AgentType.DEBUGGING], value: AgentType.DEBUGGING },
];

export const AGENT_STATUS_OPTIONS: MultipSelectOption[] = [
  { label: AGENT_STATUS_LABELS[AgentStatus.IDLE], value: AgentStatus.IDLE },
  {
    label: AGENT_STATUS_LABELS[AgentStatus.RUNNING],
    value: AgentStatus.RUNNING,
  },
];

export const AGENT_CONTEXT_KEYS: ContextKeyConfig[] = [
  { key: "agent", label: "Agent", tools: ["read_file", "write_patch"] },
];

export const AGENT_UI_FEATURES: AgentFeatureFlags = {
  reasoning: true,
  artifactsPanel: false,
  modelSwitching: false,
  historySidebar: false,
  toolConfiguration: false,
  pageContextAttachments: false,
  fileAttachments: true,
  selectionAttachments: true,
};

export const AGENT_UI_THEME: Partial<AgentThemeTokens> = {
  accent: "var(--chakra-colors-brand-500)",
  accentSoft: "#473cfb36",
  // Map directly to Chakra semantic tokens
  background: "var(--chakra-colors-bg-primary)",
  surface: "var(--chakra-colors-bg-surface)",
  text: "var(--chakra-colors-body)",
  subtext: "var(--chakra-colors-muted)",
  border: "var(--chakra-colors-border-primary)",
  // Still use brand palette for status accents
  warning: "var(--chakra-colors-yellow-400)",
  danger: "var(--chakra-colors-m-red)",
  fontFamily: "Inter, sans-serif",
  radius: "16px",
  fontSize: "14px",
};

export const AGENT_STATUS_COLOR_MAP: Record<AgentStatus, string> = {
  [AgentStatus.IDLE]: "var(--chakra-colors-gray-400)",
  [AgentStatus.RUNNING]: "var(--chakra-colors-green-400)",
};
