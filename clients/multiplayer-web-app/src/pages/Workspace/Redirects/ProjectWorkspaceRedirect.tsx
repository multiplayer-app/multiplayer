import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import PageLoading from "shared/components/PageLoading";
import { useAuth } from "shared/providers/AuthContext";
import { getWorkspaceProjectsNavCached } from "shared/navigation/workspaceProjectsNavCache";
import { resolveDefaultProjectPath } from "shared/navigation/defaultProjectPath";

const ProjectWorkspaceRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams();
  const { userId } = useAuth();

  useEffect(() => {
    if (!workspaceId) {
      navigate("/not-found", { replace: true });
      return;
    }

    const isPublic = location.pathname.startsWith("/public/");
    let cancelled = false;

    (async () => {
      try {
        const projects = await getWorkspaceProjectsNavCached(workspaceId);
        const target = resolveDefaultProjectPath(
          userId,
          workspaceId,
          projects,
          isPublic
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
  }, [workspaceId, userId, location.pathname, navigate]);

  return <PageLoading />;
};

export default ProjectWorkspaceRedirect;
