import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FeatureFlag,
  IntegrationTypeEnum,
  IRadarDetection,
  RadarDetectionSource,
  RadarDetectionType,
} from "@multiplayer/types";
import { useParams } from "react-router-dom";

import { usePermissions } from "shared/providers/PermissionsContext";
import {
  EntityCategories,
  SortingDirection,
  SortingDirectionMap,
  SystemCatalogTabTypes,
} from "shared/models/enums";

import {
  getFlows,
  getRadarDependencyDetections,
  getRadarDetectedEnvironments,
  getRadarDetections,
  getRadarPlatforms,
  getSystemCatalogStats,
  getUniqueComponentsInDependencies,
  getUniqueComponentsInFlows,
} from "shared/services/radar.service";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import { SYSTEM_CATALOG_LIMIT } from "pages/Workspace/Project/SystemCatalog/systemCatalog.config";
import { useEntities } from "shared/providers/EntitiesContext";
import { extractKeyValue } from "@multiplayer/util-shared";

interface ISystemCatalogStateContext {
  counts: any;
  emptySystemData: boolean;
  tabsState: ISystemCatalogTabsState;
  setTabsState: any;
  isLoading: boolean;
  isRadarActive: boolean;
  isCountLoading: boolean;
  systemCatalogData: any;
  componentsInDeps: any[];
  componentsInFlows: any[];
  detectedEnvironments: any[];
  showDifferences: boolean;
  setShowDifferences: any;
  newComponents: any[];
  getAPIs: () => void;
  getFlowsData: () => void;
  getComponents: () => void;
  getDependencies: () => void;
  getPlatformsData: () => void;
  getEnvironmentsData: () => void;
}

interface ISystemCatalogTabsState {
  [tabName: string]: ITabState;
}

interface ITabState {
  query: string;
  tags?: string[];
  sorting?: {
    key: string;
    direction: SortingDirection;
  };
  filter?: {
    [filterName: string]: any[];
  };
  params?: { skip: number; limit: number; total?: number };
}

const initialTabsState: ISystemCatalogTabsState = {
  [SystemCatalogTabTypes.Components]: {
    query: "",
    tags: [],
    filter: {
      status: [],
      component: [],
      platforms: [],
      environments: [],
    },
    params: { skip: 0, limit: SYSTEM_CATALOG_LIMIT },
  },
  [SystemCatalogTabTypes.APIs]: {
    query: "",
    filter: {
      status: [],
      platforms: [],
      environments: [],
      protocol: [],
    },
    params: { skip: 0, limit: SYSTEM_CATALOG_LIMIT },
  },
  [SystemCatalogTabTypes.Flows]: {
    query: "",
    tags: [],
    filter: {
      platforms: [],
      components: [],
      environments: [],
    },
    params: { skip: 0, limit: SYSTEM_CATALOG_LIMIT },
  },
  [SystemCatalogTabTypes.Dependencies]: {
    query: "",
    filter: {
      sourceComponent: [],
      targetComponent: [],
      protocol: [],
      status: [],
    },
    params: { skip: 0, limit: SYSTEM_CATALOG_LIMIT },
  },
  [SystemCatalogTabTypes.Platforms]: {
    query: "",
    tags: [],
    filter: {
      environments: [],
    },
    params: { skip: 0, limit: SYSTEM_CATALOG_LIMIT },
  },
  [SystemCatalogTabTypes.Environments]: {
    query: "",
    tags: [],
    params: { skip: 0, limit: SYSTEM_CATALOG_LIMIT },
  },
};

interface ISystemCatalogData {
  [tabName: string]: {
    data: any[];
    total: number;
  };
}

const initialSystemCatalogData = {
  [SystemCatalogTabTypes.APIs]: {
    data: [],
    total: 0,
  },
  [SystemCatalogTabTypes.Flows]: {
    data: [],
    total: 0,
  },
  [SystemCatalogTabTypes.Platforms]: {
    data: [],
    total: 0,
  },
  [SystemCatalogTabTypes.Environments]: {
    data: [],
    total: 0,
  },
  [SystemCatalogTabTypes.Components]: {
    data: [],
    total: 0,
  },
  [SystemCatalogTabTypes.Dependencies]: {
    data: [],
    total: 0,
  },
};

export const SystemCatalogProvider = ({ children }) => {
  const { entities } = useEntities();
  const { hasFeature } = usePermissions();
  const { workspaceId, projectId } = useParams();
  const { integrations: all } = useIntegrations();
  const isRadarActive = useMemo(
    () => !!all.get(IntegrationTypeEnum.OTEL)?.length,
    [all]
  );

  const [tabsState, setTabsState] =
    useState<ISystemCatalogTabsState>(initialTabsState);
  const [systemCatalogData, setSystemCatalogData] =
    useState<ISystemCatalogData>(initialSystemCatalogData);
  const [isLoading, setIsLoading] = useState(false);
  const [isCountLoading, setIsCountLoading] = useState(false);
  const [newComponents, setNewComponents] = useState<IRadarDetection[]>([]);
  const [detectedEnvironments, setDetectedEnvironments] = useState([]);
  const [componentsInFlows, setComponentsInFlows] = useState([]);
  const [componentsInDeps, setComponentsInDeps] = useState([]);

  const [showDifferences, setShowDifferences] = useState(false);

  const [counts, setCounts] = useState({
    [SystemCatalogTabTypes.APIs]: 0,
    [SystemCatalogTabTypes.Flows]: 0,
    [SystemCatalogTabTypes.Platforms]: 0,
    [SystemCatalogTabTypes.Components]: 0,
    [SystemCatalogTabTypes.Dependencies]: 0,
    [SystemCatalogTabTypes.Environments]: 0,
  });

  const emptySystemData = useMemo(() => {
    return Object.values(counts).every((value) => Number(value) === 0);
  }, [counts]);

  const getNewComponents = useCallback(async () => {
    const res = await getRadarDetections(workspaceId, projectId, {
      type: RadarDetectionType.SERVICE,
      Sign: [RadarDetectionSource.RADAR.toString()],
      skip: 0,
      limit: 200, // TODO discuss
    });

    setNewComponents(res?.data as IRadarDetection[]);
  }, [projectId, workspaceId]);

  const getCounts = useCallback(async () => {
    try {
      const res = await getSystemCatalogStats(workspaceId, projectId);
      const countsObject = {
        [SystemCatalogTabTypes.APIs]: res.apis,
        [SystemCatalogTabTypes.Flows]: res.flows,
        [SystemCatalogTabTypes.Platforms]: res.platforms,
        [SystemCatalogTabTypes.Components]: res.components,
        [SystemCatalogTabTypes.Environments]: res.environments,
        [SystemCatalogTabTypes.Dependencies]: res.dependencies,
      };
      setCounts(countsObject);
      setIsCountLoading(false);
    } catch (error) {
      console.error(error);
      setIsCountLoading(false);
    }
  }, [workspaceId, projectId]);

  const getComponents = useCallback(async () => {
    try {
      const { sorting, params, filter, query, tags } =
        tabsState[SystemCatalogTabTypes.Components];

      const sortingObject = sorting
        ? sorting?.key === "Timestamp"
          ? {
              sortKey: ["Sign", sorting.key],
              sortDirection: [sorting.direction, sorting.direction],
            }
          : {
              sortKey: [sorting.key],
              sortDirection: [sorting.direction],
            }
        : null;
      setIsLoading(true);
      const res = await getRadarDetections(workspaceId, projectId, {
        type: RadarDetectionType.SERVICE,
        ...params,
        ...(filter.platforms && {
          platformIds: filter.platforms.map((p) => p.value),
        }),
        ...(filter.environments && {
          environmentNames: filter.environments.map((p) => p.label),
        }),
        ...(query && {
          text: query.trim(),
        }),
        ...(filter.status && {
          Sign: filter.status.map((p) => p.value),
        }),
        ...(showDifferences && {
          Sign: [RadarDetectionSource.RADAR.toString()],
        }),
        ...(sorting && sortingObject),
        ...(tags && {
          tags,
        }),
      });

      const data = (res?.data as IRadarDetection[])?.map((rd) => ({
        _id: rd.id,
        ...rd,
      }));

      setSystemCatalogData((prev) => ({
        ...prev,
        [SystemCatalogTabTypes.Components]: {
          data: data,
          total: res?.cursor.total,
        },
      }));
      setIsLoading(false);
      await getNewComponents();
      if (
        !filter.platforms?.length &&
        !filter.environments?.length &&
        !showDifferences &&
        !query
      ) {
        getCounts();
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }, [tabsState, workspaceId, projectId, showDifferences, getCounts]);

  const getAPIs = useCallback(async () => {
    try {
      const { sorting, params, filter, query } =
        tabsState[SystemCatalogTabTypes.APIs];

      setIsLoading(true);

      const res = await getRadarDetections(workspaceId, projectId, {
        type: RadarDetectionType.ENDPOINT,
        ...params,
        ...(filter.platforms && {
          platformIds: filter.platforms.map((p) => p.value),
        }),
        ...(filter.environments && {
          environmentNames: filter.environments.map((p) => p.label),
        }),
        ...(filter.protocol && {
          endpointType: filter.protocol.map((p) => p.value),
        }),
        ...(query && {
          text: query.trim(),
        }),
        ...(filter.status && {
          Sign: filter.status.map((p) => p.value),
        }),
        ...(showDifferences && {
          Sign: [RadarDetectionSource.RADAR.toString()],
        }),
        ...(sorting && {
          sortKey: [
            sorting.key === "serviceName" ? "componentName" : sorting.key,
          ],
          sortDirection: [sorting.direction],
        }),
      });

      const data = (res?.data as IRadarDetection[])?.map((rd) => ({
        _id: rd.id,
        ...rd,
      }));

      setSystemCatalogData((prev) => ({
        ...prev,
        [SystemCatalogTabTypes.APIs]: {
          data: data,
          total: res?.cursor.total,
        },
      }));

      setIsLoading(false);

      if (
        !filter.platforms?.length &&
        !filter.protocol?.length &&
        !filter.environments?.length &&
        !showDifferences &&
        !query
      ) {
        getCounts();
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }, [tabsState, workspaceId, projectId, showDifferences]);

  const getDependencies = useCallback(async () => {
    try {
      const { sorting, params, query, filter } =
        tabsState[SystemCatalogTabTypes.Dependencies];

      setIsLoading(true);

      const res = await getRadarDependencyDetections(workspaceId, projectId, {
        ...params,
        ...(query && {
          text: query.trim(),
        }),
        ...(filter.sourceComponent && {
          sourceComponentNames: filter.sourceComponent.map((p) => p.value),
        }),
        ...(filter.targetComponent && {
          targetComponentNames: filter.targetComponent.map((p) => p.value),
        }),
        ...(filter.protocol && {
          targetEndpointType: filter.protocol.map((p) => p.value),
        }),
        ...(filter.status && {
          Sign: filter.status.map((p) => p.value),
        }),
        ...(sorting && {
          sortKey: [sorting.key],
          sortDirection: [sorting.direction],
        }),
      });
      const ids = new Set<string>();
      const data = (res?.data as IRadarDetection[])?.reduce(
        (acc, rd: IRadarDetection) => {
          if (ids.has(rd.id)) {
            return acc;
          }
          ids.add(rd.id);
          acc.push({
            _id: rd.id,
            ...rd,
            Sign: String(rd.Sign),
          });
          return acc;
        },
        []
      );

      setSystemCatalogData((prev) => ({
        ...prev,
        [SystemCatalogTabTypes.Dependencies]: {
          data: data,
          total: res?.cursor?.total,
        },
      }));

      setIsLoading(false);

      if (
        !filter.sourceComponent?.length &&
        !filter.targetComponent?.length &&
        !query
      ) {
        getCounts();
        const components = await getUniqueComponentsInDependencies(
          workspaceId,
          projectId
        );
        setComponentsInDeps(
          components?.map(({ componentName }) => ({
            label: componentName,
            value: componentName,
          }))
        );
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }, [tabsState, workspaceId, projectId]);

  const getFlowsData = useCallback(async () => {
    if (hasFeature(FeatureFlag.FLOWS)) {
      try {
        const { sorting, params, filter, query, tags } =
          tabsState[SystemCatalogTabTypes.Flows];

        setIsLoading(true);

        const res = await getFlows(workspaceId, projectId, {
          ...params,
          ...(filter.platforms && {
            platformIds: filter.platforms.map((p) => p.value),
          }),
          ...(filter.environments && {
            environmentNames: filter.environments.map((p) => p.label),
          }),
          ...(filter.components && {
            componentNames: filter.components.map((p) => p.value),
          }),
          ...(query && {
            name: query.trim(),
          }),
          ...(sorting && {
            sortKey: sorting.key,
            sortDirection: SortingDirectionMap[sorting.direction],
          }),
          ...(tags && {
            tags,
          }),
        });

        setSystemCatalogData((prev) => ({
          ...prev,
          [SystemCatalogTabTypes.Flows]: {
            data: res?.data,
            total: res?.cursor?.total,
          },
        }));

        setIsLoading(false);

        const components = await getUniqueComponentsInFlows(
          workspaceId,
          projectId
        );
        setComponentsInFlows(
          components?.componentNames
            .map((componentName: string) => ({
              label: componentName,
              value: componentName,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    }
  }, [workspaceId, projectId, tabsState, hasFeature]);

  const getEnvironmentsData = useCallback(async () => {
    try {
      const { query, sorting, tags } =
        tabsState[SystemCatalogTabTypes.Environments];

      let currentData;
      const envs = entities[EntityCategories.ENVIRONMENT];
      currentData = envs.map((entity) => ({
        ...entity,
        _id: entity.entityId,
      }));

      if (query) {
        currentData = currentData.filter((env) => {
          return env.key.toLowerCase().includes(query.toLowerCase());
        });
      }

      if (sorting?.key) {
        currentData.sort((a, b) => {
          if (sorting.direction === SortingDirection.ASC) {
            return a.key.localeCompare(b.key);
          } else {
            return b.key.localeCompare(a.key);
          }
        });
      }

      if (tags?.length) {
        currentData = currentData.filter((env) => {
          return tags.every((tag) => {
            const tagObject: any = extractKeyValue(tag);
            return env.tags.some(
              (t) => t.key === tagObject.key && t.value === tagObject.value
            );
          });
        });
      }

      setSystemCatalogData((prev) => ({
        ...prev,
        [SystemCatalogTabTypes.Environments]: {
          data: currentData,
          total: currentData.length,
        },
      }));
    } catch (err) {
      console.error(err);
    }
  }, [entities, tabsState]);

  const getPlatformsData = useCallback(async () => {
    try {
      const { params, query, sorting, filter, tags } =
        tabsState[SystemCatalogTabTypes.Platforms];

      setIsLoading(true);

      const res = await getRadarPlatforms(workspaceId, projectId, {
        ...params,
        ...(query && {
          text: query.trim(),
        }),
        ...(filter.environments && {
          environmentNames: filter.environments.map((p) => p.label),
        }),
        ...(sorting && {
          sortKey: sorting.key === "platformKey" ? "key" : sorting.key,
          sortDirection: SortingDirectionMap[sorting.direction],
        }),
        ...(tags && {
          tags,
        }),
        default: false,
      });

      const currentData =
        res?.data
          ?.filter((p) => p.entity?.default !== true)
          .map(({ entity }) => ({
            ...entity,
            _id: entity.entityId,
          })) || [];

      setSystemCatalogData((prev) => ({
        ...prev,
        [SystemCatalogTabTypes.Platforms]: {
          data: currentData,
          total: res?.cursor?.total,
        },
      }));

      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }, [projectId, workspaceId, tabsState]);

  const getDetectedEnvironments = useCallback(async () => {
    try {
      const res = await getRadarDetectedEnvironments(workspaceId, projectId);
      const envList = res?.map(({ environmentName }) => ({
        label: environmentName,
        value: environmentName,
      }));
      setDetectedEnvironments(envList);
    } catch (error) {
      console.error(error);
    }
  }, [workspaceId, projectId]);

  useEffect(() => {
    setIsCountLoading(true);
    getCounts();
    getDetectedEnvironments();
  }, [getCounts, getDetectedEnvironments]);

  useEffect(() => {
    if (showDifferences) {
      getNewComponents();
    }
  }, [showDifferences, getNewComponents]);

  return (
    <SystemCatalogContext.Provider
      value={{
        counts,
        emptySystemData,
        getAPIs,
        isLoading,
        tabsState,
        setTabsState,
        isRadarActive,
        isCountLoading,
        getFlowsData,
        getComponents,
        getDependencies,
        getPlatformsData,
        getEnvironmentsData,
        systemCatalogData,
        newComponents,
        componentsInDeps,
        componentsInFlows,
        detectedEnvironments,
        showDifferences,
        setShowDifferences,
      }}
    >
      {children}
    </SystemCatalogContext.Provider>
  );
};

export const SystemCatalogContext =
  createContext<ISystemCatalogStateContext | null>(null);

export function useSystemCatalog() {
  const context = useContext(SystemCatalogContext);
  return context;
}
