import { useEffect, useState } from "react";
import { RadarDetectionType } from "@multiplayer/types";

import { getRadarDetections } from "shared/services/radar.service";

// Projects have a handful of environments; enough to list them all
const MAX_ENVIRONMENTS = 200;

// The environments seen in the project's traces (as listed in the issue filters), by name
export const useProjectEnvironments = (
  workspaceId?: string,
  projectId?: string
) => {
  const [environments, setEnvironments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !projectId) return;
    let cancelled = false;
    setLoading(true);

    getRadarDetections(workspaceId, projectId, {
      type: RadarDetectionType.ENVIRONMENT,
      // the API takes limit only together with skip
      skip: 0,
      limit: MAX_ENVIRONMENTS,
    })
      .then((res) => {
        if (cancelled) return;
        const names: string[] = (res.data || [])
          .map((env: any) => env.environmentName || env.environmentNames?.[0])
          .filter(Boolean);
        setEnvironments(
          Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
        );
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, projectId]);

  return { environments, loading };
};
