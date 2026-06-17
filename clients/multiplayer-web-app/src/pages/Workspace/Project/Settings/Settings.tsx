import { Navigate, Route, Routes } from "react-router-dom";
import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";

import CheckAccess from "shared/components/CheckAccess";
import { SettingsLayoutProvider } from "shared/providers/SettingsLayoutContext";

import Members from "./Workspace/Members";
import Billing from "./Workspace/Billing";
import General from "./Workspace/General";
import Projects from "./Workspace/Projects";
import AlertRules from "./Workspace/AlertRules";
import Integrations from "./Workspace/Integrations";

import Profile from "./Account/Profile";
import LinkedAccounts from "./Account/LinkedAccounts";

import Team from "./Team";
import Project from "./Project";
import Layout from "./SettingsLayout";

const Settings = () => {
  return (
    <Routes>
      <Route
        element={
          <SettingsLayoutProvider>
            <Layout />
          </SettingsLayoutProvider>
        }
      >
        <Route
          path="general"
          element={
            <CheckAccess
              entity={RoleWorkspacePermissionEntity.WORKSPACE}
              permission={RoleAccessAction.UPDATE}
              fallbackElement={<Navigate to="profile" />}
            >
              <General />
            </CheckAccess>
          }
        />
        <Route path="members" element={<Members />} />
        <Route
          path="projects"
          element={
            <CheckAccess
              entity={RoleWorkspacePermissionEntity.WORKSPACE}
              permission={RoleAccessAction.UPDATE}
              fallbackElement={<Navigate to="profile" />}
            >
              <Projects />
            </CheckAccess>
          }
        />
        <Route
          path="billing"
          element={
            <CheckAccess
              entity={RoleWorkspacePermissionEntity.WORKSPACE}
              permission={RoleAccessAction.BILLING_READ}
            >
              <Billing />
            </CheckAccess>
          }
        />

        <Route
          path="integrations/*"
          element={
            <CheckAccess
              entity={RoleWorkspacePermissionEntity.WORKSPACE}
              permission={RoleAccessAction.UPDATE}
              fallbackElement={<Navigate to="profile" />}
            >
              <Integrations />
            </CheckAccess>
          }
        />
        <Route
          path="alert-rules"
          element={
            <CheckAccess
              entity={RoleWorkspacePermissionEntity.WORKSPACE}
              permission={RoleAccessAction.UPDATE}
              fallbackElement={<Navigate to="profile" />}
            >
              <AlertRules />
            </CheckAccess>
          }
        />
        <Route path="profile" element={<Profile />} />
        <Route path="linked-accounts" element={<LinkedAccounts />} />
        <Route path="team/:teamId" element={<Team />} />
        <Route path="project/*" element={<Project />} />
        <Route
          path="*"
          element={
            <CheckAccess
              entity={RoleWorkspacePermissionEntity.WORKSPACE}
              permission={RoleAccessAction.UPDATE}
              fallbackElement={<Navigate to="profile" />}
            >
              <Navigate to="general" />
            </CheckAccess>
          }
        />
      </Route>
    </Routes>
  );
};

export default Settings;
