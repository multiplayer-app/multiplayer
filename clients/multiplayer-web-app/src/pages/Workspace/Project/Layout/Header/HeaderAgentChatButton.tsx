import { Button } from "@chakra-ui/react";
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

import Icon from "shared/components/Icon";
import CheckAccess from "shared/components/CheckAccess";
import { usePanelChat, useAgentsPage } from "shared/components/AgentChat";

const HeaderAgentChatButton = () => {
  const { isOpen, togglePanel } = usePanelChat();
  const isAgentsPage = useAgentsPage();

  if (isAgentsPage) return null;

  return (
    <CheckAccess
      scope={RoleType.PROJECT}
      permission={RoleAccessAction.READ}
      entity={RoleProjectPermissionEntity.AGENT_CHAT}
    >
      <Button
        size="sm"
        variant="light"
        borderColor={isOpen ? "brand.500" : null}
        leftIcon={<Icon name="Bot" boxSize="20px" />}
        onClick={togglePanel}
      >
        Agent sessions
      </Button>
    </CheckAccess>
  );
};

export default HeaderAgentChatButton;
