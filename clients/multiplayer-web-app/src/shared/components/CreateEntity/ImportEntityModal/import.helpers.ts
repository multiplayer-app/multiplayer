import {
  ComponentType,
  EntityType,
  EntityVisibility,
  PlatformComponentOwner,
} from "@multiplayer/types";
import { getSlugifiedName } from "shared/utils";
import { extractKeyValue, normalizeTag } from "@multiplayer/util-shared";

const createComponentMetadata = (component: any) => {
  const { owner, type, visibility, shortDescription } = component;
  const metadata = {
    ...(owner && { owner }),
    ...(type && { type }),
    ...(visibility && { visibility }),
    ...(shortDescription && { shortDescription }),
  };

  return Object.keys(metadata).length > 0 ? metadata : undefined;
};

export const transformComponentToCreate = (component: any) => {
  const baseComponent = {
    key: component.key,
    tags: component.tags || [],
    keyAliases: component.aliases || [],
    type: EntityType.PLATFORM_COMPONENT,
  };

  const metadata = createComponentMetadata(component);

  return metadata ? { ...baseComponent, metadata } : baseComponent;
};

export const transformComponentToUpdate = (component: any) => {
  const { entityId, tags, aliases } = component;
  const baseComponent = {
    entityId,
    ...(tags && { tags }),
    ...(aliases && { keyAliases: aliases }),
  };

  const metadata = createComponentMetadata(component);

  return metadata ? { ...baseComponent, metadata } : baseComponent;
};

export const typeConverters: Record<
  string,
  (value: string, name?: string) => any
> = {
  name: (nameValue) => {
    return getSlugifiedName(nameValue);
  },
  type: (typeValue, name) => {
    const normalizedType = typeValue.trim().toLowerCase();
    if (!normalizedType) {
      return ComponentType.GENERIC;
    }
    if (
      Object.values(ComponentType).includes(normalizedType as ComponentType)
    ) {
      return normalizedType as ComponentType;
    }
    throw new Error(
      `Invalid type value: "${typeValue}" for component named "${name}". Must be one of: ${Object.values(
        ComponentType
      ).join(", ")}`
    );
  },
  owner: (ownerValue, name) => {
    const normalizedOwner = ownerValue.trim().toLowerCase();
    if (
      Object.values(PlatformComponentOwner).includes(
        normalizedOwner as PlatformComponentOwner
      )
    ) {
      return normalizedOwner as PlatformComponentOwner;
    }
    throw new Error(
      `Invalid owner value "${ownerValue}" for component named "${name}". Must be one of: ${Object.values(
        PlatformComponentOwner
      ).join(", ")}`
    );
  },
  scope: (scopeValue, name) => {
    const normalizedScope = scopeValue.trim().toLowerCase();
    if (
      Object.values(EntityVisibility).includes(
        normalizedScope as EntityVisibility
      )
    ) {
      return normalizedScope as EntityVisibility;
    }
    throw new Error(
      `Invalid scope value: "${scopeValue}" for component named "${name}". Must be one of: ${Object.values(
        EntityVisibility
      ).join(", ")}`
    );
  },
  tags: (tagList) => {
    if (!tagList || tagList.trim() === "") return [];
    return tagList
      .split(",")
      .map((tagString) => normalizeTag(tagString.trim()))
      .filter((t) => !!t)
      .map((tag) => extractKeyValue(tag));
  },
  aliases: (aliasList) => {
    if (!aliasList || aliasList.trim() === "") return [];
    return aliasList.split(",").map((alias) => alias.trim());
  },
  dependsOn: (dependencies) => {
    if (!dependencies || dependencies.trim() === "") return [];
    return dependencies.split(",").map((dep) => dep.trim());
  },
};
