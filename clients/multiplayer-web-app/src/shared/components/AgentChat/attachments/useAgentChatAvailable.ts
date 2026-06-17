import {
  FeatureFlag,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

import { useAgents } from "shared/providers/AgentRuntimeContext";
import {
  useAccessCheck,
  useFeatureFlagCheck,
} from "shared/providers/PermissionsContext";

/** True when project agents are enabled and at least one worker is available. */
export function useAgentChatAvailable() {
  const hasFeature = useFeatureFlagCheck(FeatureFlag.AGENTS);
  const hasAccess = useAccessCheck(
    RoleProjectPermissionEntity.AGENT_CHAT,
    RoleAccessAction.UPDATE,
    RoleType.PROJECT
  );
  const { agents } = useAgents();

  return hasFeature && hasAccess && agents.data.length > 0;
}
