import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import PageLoading from "shared/components/PageLoading";
import { useAuth } from "shared/providers/AuthContext";
import { getWorkspaceProjectsNavCached } from "shared/navigation/workspaceProjectsNavCache";
import { getWorkspaceId } from "shared/storage/workspaceStorage";
import { resolveDefaultProjectPath } from "shared/navigation/defaultProjectPath";

const HomeRedirect = () => {
  const { user, userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      return;
    }
    const ws = getWorkspaceId(user.workspaces);
    if (!ws) {
      navigate("/dashboard/create-workspace", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const projects = await getWorkspaceProjectsNavCached(ws);
        const target = resolveDefaultProjectPath(
          userId,
          ws,
          projects,
          false
        );
        if (cancelled) return;
        if (target) {
          navigate(target, { replace: true });
        } else {
          navigate(`/project/${ws}/projects`, { replace: true });
        }
      } catch {
        if (!cancelled) {
          navigate(`/project/${ws}/projects`, { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, userId, navigate]);

  return <PageLoading />;
};

export default HomeRedirect;
