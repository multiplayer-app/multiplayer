import { EntityData } from './entity-data'

export enum ComponentType {
  CLIENT = 'client',
  GENERIC = 'generic',
  PLATFORM = 'platform',
  SERVICE = 'service',
}

export const ComponentTypeToNameMap = {
  [ComponentType.CLIENT]: 'Client',
  [ComponentType.GENERIC]: 'Component',
  [ComponentType.PLATFORM]: 'SaaS',
  [ComponentType.SERVICE]: 'Service',
}

export const RadarComponentTypeOrder = [
  ComponentType.CLIENT,
  ComponentType.SERVICE,
  ComponentType.GENERIC,
  ComponentType.PLATFORM,
]

export enum EdgeDirection {
  top = 'top',
  right = 'right',
  bottom = 'bottom',
  left = 'left',
}

export enum EdgePositionAuto {
  auto = 'auto',
}

export type EdgePosition = EdgeDirection | EdgePositionAuto;
export interface ObjectWithDetection {
  detectionId?: string;
}
export interface Edge extends ObjectWithDetection {
  id: string;
  source: string;
  target: string;
  label?: string;
  isDeleted?: boolean;
  targetPosition?: EdgePosition;
  sourcePosition?: EdgePosition;
}
export interface ComponentMetadata {
  color?: string;
  iconUrl?: string;
  [key: string]: any;
}
export interface Component extends ObjectWithDetection {
  id: string;
  name?: string;
  type?: ComponentType;
  groupId?: string;
  linkedTo?: string;
  isDeleted?: boolean;
  data?: ComponentMetadata;
}
export interface Group {
  id: string;
  name: string;
  color: string;
  iconUrl?: string;
  groupId?: string;
}

export enum VisualizationType {
  DIAGRAM = 'diagram',
  TABLE = 'table',
}

// Component and Group state
export interface NodeState {
  x: number;
  y: number;
  width?: number;
  height?: number;
  collapsed?: boolean;
}

export type VisualizationState = Record<string, NodeState>; // | Other

export interface View {
  id: string;
  name: string;
  groups?: string[];
  components?: string[];
  visualizations: Partial<Record<VisualizationType, VisualizationState>>;
}

export enum PlatformLayoutMode {
  AUTO = 'auto',
  MANUAL = 'manual',
}

export enum PlatformLayoutAlgorithm {
  FLOW = 'flow',
  TREE = 'tree',
  CLUSTERED = 'clustered',
}

export enum PlatformLayoutDirection {
  VERTICAL = 'TB',
  HORIZONTAL = 'LR',
}

export enum PlatformLayoutAlign {
  START = 'start',
  CENTER = 'center',
}

export interface PlatformLayout {
  mode: PlatformLayoutMode;
  algorithm: PlatformLayoutAlgorithm;
  direction: PlatformLayoutDirection;
  align?: PlatformLayoutAlign;
}
export interface PlatformMetadata {
  defaultView: string;
  layout: PlatformLayout;
}
export interface PlatformRadarData {
  hash?: string;
  enabled: boolean;
  linkEnabled: boolean;
  ignoredDetections: string[];
}

export const DEFAULT_LAYOUT = {
  mode: PlatformLayoutMode.AUTO,
  align: PlatformLayoutAlign.CENTER,
  algorithm: PlatformLayoutAlgorithm.FLOW,
  direction: PlatformLayoutDirection.HORIZONTAL,
}

export const DEFAULT_VIEW = '_all'
export const UNKNOWN_X = -99999
export const UNKNOWN_Y = -99999
export const DEFAULT_BACKGROUND_COLORS = [
  { name: 'Gray', hex: '#808080' },
  { name: 'Red', hex: '#FF4500' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Yellow', hex: '#FFD700' },
  { name: 'Green', hex: '#008000' },
  { name: 'Blue', hex: '#1E90FF' },
  { name: 'Purple', hex: '#8A2BE2' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
]

export interface Platform extends EntityData {
  metadata: PlatformMetadata;
  radar: PlatformRadarData;
  edges: Record<string, Edge>;
  components: Record<string, Component>;
  groups?: Record<string, Group>;
  views: {
    [DEFAULT_VIEW]: View;
    [viewId: string]: View;
  };
}
