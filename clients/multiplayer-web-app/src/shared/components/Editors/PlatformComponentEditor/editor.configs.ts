import {
  ComponentTypeToNameMap,
  PlatformComponentOwnerToNameMap,
  EntityVisibilityToNameMap,
} from "@multiplayer/types";

export const PlatformComponentFields = {
  name: { label: "Name" },
  type: { label: "Type", valueNameMap: ComponentTypeToNameMap },
  slug: { label: "Slug" },
  shortDescription: { label: "Short Description" },
  visibility: {
    label: "Scope",
    valueNameMap: EntityVisibilityToNameMap,
  },
  owner: { label: "Owner", valueNameMap: PlatformComponentOwnerToNameMap },
};
