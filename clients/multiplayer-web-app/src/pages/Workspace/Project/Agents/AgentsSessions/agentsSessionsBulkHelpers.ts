import type { AgentChatsBulkRemoveParams } from "shared/services/radar.service";

export function getAgentSessionsBulkFilter(
  selectedIds: string[]
): AgentChatsBulkRemoveParams {
  return { ids: selectedIds.filter(Boolean) };
}
