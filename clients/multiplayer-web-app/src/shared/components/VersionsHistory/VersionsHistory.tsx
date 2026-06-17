import { useDisclosure } from "@chakra-ui/react";
import { HistoryRoundIcon } from "shared/icons";

import { ToolbarButton } from "../Toolbar";
import VersionsHistoryDrawer from "./VersionsHistoryDrawer";
import CheckAccess from "../CheckAccess";
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

interface VersionsHistoryProps {}

const VersionsHistory = (props: VersionsHistoryProps) => {
  const disclosure = useDisclosure();

  return (
    <CheckAccess
      scope={RoleType.ACCOUNT}
      permission={RoleAccessAction.UPDATE}
      entity={RoleProjectPermissionEntity.ENTITY}
    >
      <ToolbarButton
        label="Version history"
        icon={<HistoryRoundIcon />}
        onClick={() => disclosure.onToggle()}
        isActive={disclosure.isOpen}
      />
      <VersionsHistoryDrawer disclosure={disclosure} />
    </CheckAccess>
  );
};

export default VersionsHistory;
