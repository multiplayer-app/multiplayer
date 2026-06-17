import {
  RadarDetectionType,
  RadarDetectionSource,
  ComponentType,
} from "@multiplayer/types";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { fetchAllData } from "shared/helpers/api.helpers";
import useMessage from "shared/hooks/useMessage";
import { getRadarDetections } from "shared/services/radar.service";

export default function usePlatformRadarDetections(isDefaultPlatform: boolean) {
  const message = useMessage();
  const [loading, setLoading] = useState(true);
  const { workspaceId, projectId } = useParams();
  const [detections, setDetections] = useState({
    components: [],
    dependencies: [],
  });

  const sign = useMemo(() => {
    return isDefaultPlatform ? [RadarDetectionSource.RADAR, RadarDetectionSource.SYNCED, RadarDetectionSource.DOCS] : [RadarDetectionSource.RADAR, RadarDetectionSource.SYNCED];
  }, [isDefaultPlatform]);

  const fetchComponentDetections = useCallback(async () => {
    try {
      const params = {
        type: RadarDetectionType.SERVICE,
        componentAliasName: false,
        Sign: sign,
      };
      const fetchFn = getRadarDetections.bind(null, workspaceId, projectId);
      const res = await fetchAllData<any>(fetchFn, params);

      return res.map((d) => ({
        id: d.id,
        entityId: d.entityId,
        type: ComponentType.GENERIC,
        componentName: d.componentName,
        timestamp: new Date(d.Timestamp).getTime(),
      }));
    } catch (error) {
      return [];
    }
  }, [workspaceId, projectId, sign]);

  const fetchDependencyDetections = useCallback(async () => {
    try {
      const params = {
        componentAliasName: false,
        type: RadarDetectionType.DEPENDENCY,
        Sign: sign,
      };
      const fetchFn = getRadarDetections.bind(null, workspaceId, projectId);
      const res = await fetchAllData<any>(fetchFn, params);

      return res
        .filter((d) => !d.componentAliasName)
        .map((d) => ({
          id: d.id,
          source: d.sourceComponentName,
          sourceType: ComponentType.GENERIC,
          target: d.targetComponentName,
          targetType: ComponentType.GENERIC,
          timestamp: new Date(d.Timestamp).getTime(),
        }));
    } catch (error) {
      return [];
    }
  }, [workspaceId, projectId, sign]);

  useEffect(() => {
    const fetchAllDetections = async () => {
      setLoading(true);
      try {
        const [components, dependencies] = await Promise.all([
          fetchComponentDetections(),
          fetchDependencyDetections(),
        ]);
        setDetections({ components, dependencies });
      } catch (error) {
        message.handleError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDetections();
  }, [fetchComponentDetections, fetchDependencyDetections]);

  return { loading, detections };
}
