import { ComponentType } from "@multiplayer/types";

export interface ComponentDetection {
  id: string;
  entityId: string;
  timestamp: number;
  componentName: string;
  type: ComponentType;
  isIgnored: boolean;
}
export interface DependencyDetection {
  id: string;
  source: string;
  sourceType: ComponentType;
  target: string;
  targetType: ComponentType;
  timestamp: number;
  sourceEntityId: string;
  targetEntityId: string;
  sourceNodes: Set<string>;
  targetNodes: Set<string>;
  isIgnored: boolean;
}
export interface PlatformDetections {
  components: ComponentDetection[];
  dependencies: DependencyDetection[];
}
