import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageLoading from "shared/components/PageLoading";
import { getWorkspaceProjectsNavCached } from "shared/navigation/workspaceProjectsNavCache";
import { resolveDefaultProjectPath } from "shared/navigation/defaultProjectPath";
import { useAuth } from "shared/providers/AuthContext";

const LegacyDashboardRedirect = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { userId } = useAuth();

  useEffect(() => {
    if (!workspaceId) {
      navigate("/not-found", { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const projects = await getWorkspaceProjectsNavCached(workspaceId);
        const target = resolveDefaultProjectPath(
          userId,
          workspaceId,
          projects,
          false
        );
        if (cancelled) return;
        if (target) {
          navigate(target, { replace: true });
        } else {
          navigate(`/project/${workspaceId}/projects`, { replace: true });
        }
      } catch {
        if (!cancelled) {
          navigate(`/project/${workspaceId}/projects`, { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, userId, navigate]);

  return <PageLoading />;
};

export default LegacyDashboardRedirect;
