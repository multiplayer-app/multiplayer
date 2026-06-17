import { Routes, Route, Navigate } from "react-router-dom";
import LazyContent, { lazyModule } from "shared/components/LazyContent";
import ErrorBoundary from "shared/components/ErrorBoundary";
import { Button } from "@chakra-ui/react";
import { Link } from "react-router-dom";

const WorkspaceManagement = lazyModule(() => import("./WorkspaceManagement"));

const SuperAdmin = () => {
  // Redirect non-super admins
  // if (!user?.superAdmin) {
  //   return <Navigate to="/dashboard" replace />;
  // }

  return (
    <ErrorBoundary
      ctaElement={
        <Button as={Link} to="/" replace={true}>
          Go to home
        </Button>
      }
    >
      <Routes>
        <Route index element={<Navigate to="workspaces" replace />} />
        <Route
          path="workspaces/*"
          element={<LazyContent element={<WorkspaceManagement />} />}
        />
        <Route path="*" element={<Navigate to="workspaces" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default SuperAdmin;
