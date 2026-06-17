import {
  EnvironmentTypeToNameMap,
} from '@multiplayer/types'

export const EnvironmentFields = {
  name: { label: "Name" },
  type: { label: "Environment type", valueNameMap: EnvironmentTypeToNameMap },
  slug: { label: "Slug" },
  shortDescription: { label: "Short Description" },
};
