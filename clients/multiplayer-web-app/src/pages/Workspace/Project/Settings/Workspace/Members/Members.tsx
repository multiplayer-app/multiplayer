import WorkspaceMembers from "./WorkspaceMembers";
import WorkspaceDomain from "./WorkspaceDomain";
import CheckAccess from "shared/components/CheckAccess";
import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { Content, NARROW_CONTENT_PROPS } from "../../SettingsLayout";

const Members = () => {
  return (
    <Content title="Members" contentProps={NARROW_CONTENT_PROPS}>
      <CheckAccess
        entity={RoleWorkspacePermissionEntity.WORKSPACE}
        permission={RoleAccessAction.UPDATE}
      >
        <WorkspaceDomain />
      </CheckAccess>
      <WorkspaceMembers />
    </Content>
  );
};

export default Members;
