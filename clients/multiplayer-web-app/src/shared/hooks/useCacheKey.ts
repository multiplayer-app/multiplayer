import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "shared/providers/AuthContext";

const useCacheKey = (prefix: string, includePath: boolean = false) => {
  const { projectId, path } = useParams();
  const { userId } = useAuth();
  const cacheKey = useMemo(
    () => prefix + userId + projectId + includePath ? path : '',
    [userId, projectId, path, includePath]
  );
  return cacheKey;
};

export default useCacheKey;