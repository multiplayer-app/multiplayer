import { EntityCategories, ProjectSourceType } from "shared/models/enums";
import { IProjectConfig } from "shared/models/interfaces";

import {
  formConfigs,
  importConfigs,
  entityDetails,
  projectNavItems,
  changeTypeConfigs,
  entityCategoryMap,
  emptyScreenConfigs,
  navbarExpandedWidth,
  projectSourceTypeMap,
  branchFilterStatuses,
  environmentDetailsTabs,
  DiffSupportedEntityTypes,
  defaultBranchFilterStatuses,
  platformComponentDetailsTabs,
  projectCategoryConfigs as baseConfigs,
} from "./project";

type ProjectConfig =
  | EntityCategories
  | ProjectSourceType.RADAR
  | ProjectSourceType.FLOWS
  | ProjectSourceType.AGENTS
  | ProjectSourceType.ISSUES
  | ProjectSourceType.SETTINGS
  | ProjectSourceType.DEBUGGER
  | ProjectSourceType.END_USERS;

export const projectCategoryConfigs: Record<ProjectConfig, IProjectConfig> = {
  [ProjectSourceType.SETTINGS]: {
    ...baseConfigs[ProjectSourceType.SETTINGS],
  },
  [ProjectSourceType.RADAR]: {
    ...baseConfigs[ProjectSourceType.RADAR],
  },
  [ProjectSourceType.DEBUGGER]: {
    ...baseConfigs[ProjectSourceType.DEBUGGER],
  },
  [ProjectSourceType.AGENTS]: {
    ...baseConfigs[ProjectSourceType.AGENTS],
  },
  [ProjectSourceType.ISSUES]: {
    ...baseConfigs[ProjectSourceType.ISSUES],
  },
  [ProjectSourceType.END_USERS]: {
    ...baseConfigs[ProjectSourceType.END_USERS],
  },
  [ProjectSourceType.FLOWS]: {
    ...baseConfigs[ProjectSourceType.FLOWS],
  },

  [EntityCategories.DOCUMENT]: {
    ...baseConfigs[EntityCategories.DOCUMENT],
    emptyScreen: emptyScreenConfigs[EntityCategories.DOCUMENT],
    form: formConfigs[EntityCategories.DOCUMENT],
    import: importConfigs[EntityCategories.DOCUMENT],
  },

  [EntityCategories.VARIABLE_GROUP]: {
    ...baseConfigs[EntityCategories.VARIABLE_GROUP],
    emptyScreen: emptyScreenConfigs[EntityCategories.VARIABLE_GROUP],
    form: formConfigs[EntityCategories.VARIABLE_GROUP],
  },

  [EntityCategories.SKETCH]: {
    ...baseConfigs[EntityCategories.SKETCH],
    emptyScreen: emptyScreenConfigs[EntityCategories.SKETCH],
    form: formConfigs[EntityCategories.SKETCH],
  },

  [EntityCategories.PLATFORM]: {
    ...baseConfigs[EntityCategories.PLATFORM],

    emptyScreen: emptyScreenConfigs[EntityCategories.PLATFORM],
    form: formConfigs[EntityCategories.PLATFORM],
    import: importConfigs[EntityCategories.PLATFORM],
  },

  [EntityCategories.COMPONENT]: {
    ...baseConfigs[EntityCategories.COMPONENT],
    emptyScreen: emptyScreenConfigs[EntityCategories.COMPONENT],
    form: formConfigs[EntityCategories.COMPONENT],
    import: importConfigs[EntityCategories.COMPONENT],
  },

  [EntityCategories.REPOSITORY]: {
    ...baseConfigs[EntityCategories.REPOSITORY],
    emptyScreen: emptyScreenConfigs[EntityCategories.REPOSITORY],
    form: formConfigs[EntityCategories.REPOSITORY],
  },

  [EntityCategories.SOURCE]: {
    ...baseConfigs[EntityCategories.SOURCE],
    emptyScreen: emptyScreenConfigs[EntityCategories.SOURCE],
    form: formConfigs[EntityCategories.SOURCE],
  },

  [EntityCategories.ENVIRONMENT]: {
    ...baseConfigs[EntityCategories.ENVIRONMENT],

    emptyScreen: emptyScreenConfigs[EntityCategories.ENVIRONMENT],
    form: formConfigs[EntityCategories.ENVIRONMENT],
  },

  [EntityCategories.SCHEMA]: {
    ...baseConfigs[EntityCategories.SCHEMA],

    emptyScreen: emptyScreenConfigs[EntityCategories.SCHEMA],
    form: formConfigs[EntityCategories.SCHEMA],
  },
};

const getPathForConfig = (config: IProjectConfig) => {
  return `${config.sourceType}${
    config.entityType ? `/${config.entityType}` : ""
  }`;
};

export {
  getPathForConfig,
  entityDetails,
  projectNavItems,
  entityCategoryMap,
  changeTypeConfigs,
  branchFilterStatuses,
  projectSourceTypeMap,
  navbarExpandedWidth,
  environmentDetailsTabs,
  DiffSupportedEntityTypes,
  defaultBranchFilterStatuses,
  platformComponentDetailsTabs,
};
