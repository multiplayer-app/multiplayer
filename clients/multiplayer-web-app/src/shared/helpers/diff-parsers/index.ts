import { EntityType } from "@multiplayer/types";
import { EntityConverter, EntityDiffPatch } from "@multiplayer/entity";
import {
  getModifiedPlatformData,
  getPlatformChanges,
  getPlatformConflicts,
} from "./platform-diff-parser";
import {
  getModifiedPlatformComponent,
  getPlatformComponentChanges,
  getPlatformComponentConflicts,
} from "./platform-component-diff-parser";

export const getConvertedData = (type, state) => {
  if (!state) return;
  return EntityConverter.convertStateToData(type, state);
};

export const getModifiedData = (entityType: EntityType, data: any) => {
  switch (entityType) {
    case EntityType.PLATFORM:
      return getModifiedPlatformData(data);
    case EntityType.ENVIRONMENT:
    case EntityType.PLATFORM_COMPONENT:
      return getModifiedPlatformComponent(data);
    default:
      return data;
  }
};

export const getChangesListForPreview = (entityType, payload, entities) => {
  const initialChanges = { groups: [], source: null, target: null };
  switch (entityType) {
    case EntityType.PLATFORM:
      return getPlatformChanges(payload, entities);
    case EntityType.PLATFORM_COMPONENT:
    case EntityType.ENVIRONMENT:
      return getPlatformComponentChanges(payload, entityType);
    default:
      return initialChanges;
  }
};

export const getConflicts = (
  type,
  sourcePatch,
  targetPatch,
  changes
): Set<string> => {
  switch (type) {
    case EntityType.PLATFORM:
      return getPlatformConflicts(changes);
    case EntityType.PLATFORM_COMPONENT:
      return getPlatformComponentConflicts(changes);
    default:
      return new Set(
        EntityDiffPatch.getConflictPaths(sourcePatch, targetPatch).map((c) =>
          c.join(".")
        )
      );
  }
};
