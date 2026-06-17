import { useEffect } from "react";
import { Link, Route, Outlet, Routes, Navigate } from "react-router-dom";
import { Button } from "@chakra-ui/react";

import { WorkspaceProvider } from "shared/providers/WorkspaceContext";
import { AlertDialogProvider } from "shared/providers/AlertDialogContext";
import { PermissionsProvider } from "shared/providers/PermissionsContext";
import { useRedirect } from "shared/hooks/useRedirect";
import { DashboardSettingsRedirect } from "./Redirects/SettingsRedirects";

import LazyContent, { lazyModule } from "shared/components/LazyContent";
import ErrorBoundary from "shared/components/ErrorBoundary";

const Project = lazyModule(() => import("./Project"));
const NotFound = lazyModule(() => import("./NotFound"));
const CreateWorkspacePage = lazyModule(() => import("./CreateWorkspacePage"));

const LegacyDashboardRedirect = lazyModule(
  () => import("./Redirects/LegacyDashboardRedirect")
);
const ProjectWorkspaceRedirect = lazyModule(
  () => import("./Redirects/ProjectWorkspaceRedirect")
);
const HomeRedirect = lazyModule(() => import("./Redirects/HomeRedirect"));
const SuperAdmin = lazyModule(() => import("../SuperAdmin"));

const WorkspaceProjects = lazyModule(() => import("./WorkspaceProjects"));

const projectBranchPath = "project/:workspaceId/:projectId/:branchId";
const publicProjectBranchPath = `public/${projectBranchPath}`;

const Workspace = () => {
  const { clearRedirect } = useRedirect();

  useEffect(() => {
    clearRedirect();
  }, [clearRedirect]);

  return (
    <Routes>
      <Route element={<WorkspaceLayout />}>
        <Route index element={<LazyContent element={<HomeRedirect />} />} />
        <Route
          path="superadmin/*"
          element={<LazyContent element={<SuperAdmin />} />}
        />
        <Route
          path={"dashboard/:workspaceId/settings/*"}
          element={<DashboardSettingsRedirect />}
        />
        <Route
          path={"dashboard/create-workspace"}
          element={<LazyContent element={<CreateWorkspacePage />} />}
        />
        <Route
          path={"project/:workspaceId/projects"}
          element={<LazyContent element={<WorkspaceProjects />} />}
        />
        <Route
          path={`${projectBranchPath}/*`}
          element={<LazyContent element={<Project />} />}
        />
        <Route
          path={"project/:workspaceId/*"}
          element={<LazyContent element={<ProjectWorkspaceRedirect />} />}
        />
        <Route
          path={`${publicProjectBranchPath}/*`}
          element={<LazyContent element={<Project />} />}
        />
        <Route
          path={"public/project/:workspaceId/*"}
          element={<LazyContent element={<ProjectWorkspaceRedirect />} />}
        />
        <Route
          path={"dashboard/:workspaceId/*"}
          element={<LazyContent element={<LegacyDashboardRedirect />} />}
        />
        <Route
          path="not-found"
          element={<LazyContent element={<NotFound />} />}
        />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Route>
    </Routes>
  );
};

const WorkspaceLayout = () => {
  return (
    <ErrorBoundary
      ctaElement={
        <Button as={Link} to="/" replace={true}>
          Go to home
        </Button>
      }
    >
      <WorkspaceProvider>
        <PermissionsProvider>
          <AlertDialogProvider>
            <div className="app">
              <Outlet />
            </div>
          </AlertDialogProvider>
        </PermissionsProvider>
      </WorkspaceProvider>
    </ErrorBoundary>
  );
};

export default Workspace;
