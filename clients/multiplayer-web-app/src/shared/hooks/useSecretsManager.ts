import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { SecretsManager } from '../../integrations/SecretsManager';

export interface UseSecretsManagerReturn {
  instance: SecretsManager | null;
}

const useSecretsManager = (): UseSecretsManagerReturn => {
  const { workspaceId, projectId, path: entityId } = useParams();

  const instance = useMemo<SecretsManager>(() => {
    return new SecretsManager({
      entityId,
      projectId,
      workspaceId,
    });
  }, [entityId, projectId, workspaceId]);

  return { instance };
};

export default useSecretsManager;
