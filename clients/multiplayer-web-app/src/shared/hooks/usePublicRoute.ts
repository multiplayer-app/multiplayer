import { useMemo } from "react";
import { useAuth } from "shared/providers/AuthContext";
import { useLocation, useParams } from "react-router-dom";

export const usePublicRoute = (): {
  isPublic: boolean;
  hasWorkspaceAccess: boolean;
} => {
  const { user } = useAuth();
  const location = useLocation();
  const { workspaceId } = useParams();

  const isPublic = useMemo(() => {
    return location.pathname.startsWith("/public/");
  }, [location.pathname, workspaceId, user]);

  const hasWorkspaceAccess = useMemo(() => {
    return (
      user?.workspaces?.some((w) => w._id === workspaceId) ?? false
    );
  }, [workspaceId, user]);

  return { isPublic, hasWorkspaceAccess };
};
