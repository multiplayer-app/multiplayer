import {
  ComponentType,
  EntityType,
  FeatureFlag,
  PlatformComponentOwner,
  RadarDetectionGroupType,
  RadarDetectionType,
} from "@multiplayer/types";
import { SystemCatalogTabTypes } from "shared/models/enums";

type FilterOption =
  | "tags"
  | "search"
  | "status"
  | "platforms"
  | "environments"
  | "creatable"
  | "protocol"
  | "components"
  | "sourceComponent"
  | "targetComponent";

type TabFilterConfig = Partial<Record<FilterOption, boolean>>;

export const columnTypes = {
  Component: "componentName",
  DependencyProtocol: "targetEndpointType",
  Endpoint: "httpEndpoint",
  Environments: "environments",
  Environment: "environment",
  ErrorRate: "errorRate",
  Flow: "name",
  LastActiveComponent: "Timestamp",
  LastActiveFlow: "updatedAt",
  Platform: "platformKey",
  Protocol: "endpointType",
  Radar: "Sign",
  Requests: "requests",
  ResponseTime: "responseTime",
  Service: "serviceName",
  Source: "sourceComponentName",
  Tags: "tags",
  Target: "targetComponentName",
  TargetEndpoint: "targetEndpoint",
};

export const columnsPerTabConfig = {
  [SystemCatalogTabTypes.Components]: new Set([
    columnTypes.Component,
    columnTypes.Radar,
    columnTypes.LastActiveComponent,
    columnTypes.ResponseTime,
    columnTypes.Requests,
    columnTypes.ErrorRate,
    columnTypes.Environments,
    columnTypes.Tags,
  ]),
  [SystemCatalogTabTypes.APIs]: new Set([
    columnTypes.Service,
    columnTypes.Radar,
    columnTypes.Protocol,
    columnTypes.Endpoint,
    columnTypes.Requests,
    columnTypes.Environments,
  ]),
  [SystemCatalogTabTypes.Platforms]: new Set([
    columnTypes.Platform,
    columnTypes.Requests,
    columnTypes.ResponseTime,
    columnTypes.ErrorRate,
    columnTypes.Environments,
    columnTypes.Tags,
  ]),
  [SystemCatalogTabTypes.Environments]: new Set([
    columnTypes.Environment,
    columnTypes.Tags,
  ]),
  [SystemCatalogTabTypes.Dependencies]: new Set([
    columnTypes.Source,
    columnTypes.Target,
    columnTypes.Radar,
    columnTypes.DependencyProtocol,
    columnTypes.TargetEndpoint,
    columnTypes.Requests,
  ]),
  [SystemCatalogTabTypes.Flows]: new Set([
    columnTypes.Flow,
    columnTypes.LastActiveFlow,
    columnTypes.Tags,
    // columnTypes.Platforms,
    // columnTypes.Environments,
  ]),
};

export const filtersPerTabConfig: Record<
  SystemCatalogTabTypes,
  TabFilterConfig
> = {
  [SystemCatalogTabTypes.Components]: {
    tags: true,
    search: true,
    status: true,
    platforms: true,
    environments: true,
    creatable: true,
  },
  [SystemCatalogTabTypes.APIs]: {
    search: true,
    status: true,
    platforms: true,
    environments: true,
    protocol: true,
  },
  [SystemCatalogTabTypes.Flows]: {
    tags: true,
    search: true,
    platforms: true,
    components: true,
    environments: true,
  },
  [SystemCatalogTabTypes.Platforms]: {
    tags: true,
    search: true,
    environments: true,
    creatable: true,
  },
  [SystemCatalogTabTypes.Environments]: {
    tags: true,
    search: true,
    creatable: true,
  },
  [SystemCatalogTabTypes.Dependencies]: {
    search: true,
    status: true,
    protocol: true,
    sourceComponent: true,
    targetComponent: true,
  },
};

export const tabToFeatureFlagMap: Partial<
  Record<SystemCatalogTabTypes, FeatureFlag>
> = {
  [SystemCatalogTabTypes.APIs]: FeatureFlag.RADAR_DETECT_ENDPOINTS,
  [SystemCatalogTabTypes.Dependencies]: FeatureFlag.RADAR_DEPENDENCIES,
  [SystemCatalogTabTypes.Flows]: FeatureFlag.FLOWS,
  [SystemCatalogTabTypes.Platforms]: FeatureFlag.PLATFORM,
};

export const RadarDetectionGroupTypeMap = {
  [RadarDetectionGroupType.ENVIRONMENT]: {
    label: "Environment",
    entityType: EntityType.ENVIRONMENT,
  },
  [RadarDetectionGroupType.CLIENT]: {
    label: "Component",
    entityType: EntityType.PLATFORM_COMPONENT,
  },
  [RadarDetectionGroupType.SERVICE]: {
    label: "Component",
    entityType: EntityType.PLATFORM_COMPONENT,
  },
  [RadarDetectionGroupType.EXTERNAL_SERVICE]: {
    label: "Component",
    entityType: EntityType.PLATFORM_COMPONENT,
  },
};

export const RadarDetectionToComponentTypeMap = {
  [RadarDetectionGroupType.EXTERNAL_SERVICE]: ComponentType.PLATFORM,
  [RadarDetectionGroupType.CLIENT]: ComponentType.CLIENT,
  [RadarDetectionGroupType.SERVICE]: ComponentType.SERVICE,
};

export const RadarDetectionToComponentOwnerMap = {
  [RadarDetectionGroupType.EXTERNAL_SERVICE]: PlatformComponentOwner.EXTERNAL,
  [RadarDetectionGroupType.CLIENT]: PlatformComponentOwner.INTERNAL,
  [RadarDetectionGroupType.SERVICE]: PlatformComponentOwner.INTERNAL,
  [RadarDetectionGroupType.ENVIRONMENT]: PlatformComponentOwner.INTERNAL,
};

export const TabToRadarDetectionTypeMap = {
  [SystemCatalogTabTypes.Dependencies]: RadarDetectionType.DEPENDENCY,
  [SystemCatalogTabTypes.Components]: RadarDetectionType.SERVICE,
  [SystemCatalogTabTypes.APIs]: RadarDetectionType.ENDPOINT,
};

export interface IRadarGroupInfo {
  componentName: string;
  entityId: string;
  keyAliases: string[];
  environmentNames?: string[];
  type: RadarDetectionGroupType;
}

export const RadarSignTooltip = {
  "-1": "The component has been detected by Auto-Documentation, but does not exist in Multiplayer.",
  "1": "The component exists in Multiplayer, but has not been detected by Auto-Documentation.",
  "0": "The component exists in Multiplayer and has been detected by Auto-Documentation.",
};

export const SYSTEM_CATALOG_LIMIT = 20;
