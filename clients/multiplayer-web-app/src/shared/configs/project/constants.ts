import {
  EntityType,
  FeatureFlag,
  ProjectBranchStatus,
} from "@multiplayer/types";
import { EntityCategories, ProjectSourceType } from "shared/models/enums";
import { NavBarItemType } from "shared/models/interfaces";

export const projectNavItems: (keyof typeof projectCategoryConfigs)[] = [
  ProjectSourceType.AGENTS,
  ProjectSourceType.ISSUES,
  ProjectSourceType.DEBUGGER,
  ProjectSourceType.RADAR,
  ProjectSourceType.END_USERS,
  EntityCategories.DOCUMENT,
  EntityCategories.SKETCH,
  EntityCategories.REPOSITORY,
  // EntityCategories.VARIABLE_GROUP,
];

export const entityCategoryMap = {
  [EntityType.API]: EntityCategories.SOURCE,
  [EntityType.FILE]: EntityCategories.SOURCE,
  [EntityType.SCHEMA]: EntityCategories.SCHEMA,
  [EntityType.SKETCH]: EntityCategories.SKETCH,
  [EntityType.EXCALIDRAW]: EntityCategories.SKETCH,
  [EntityType.NOTEBOOK]: EntityCategories.DOCUMENT,
  [EntityType.PLATFORM]: EntityCategories.PLATFORM,
  [EntityType.ENVIRONMENT]: EntityCategories.ENVIRONMENT,
  [EntityType.PLATFORM_COMPONENT]: EntityCategories.COMPONENT,
  [EntityType.VARIABLE_GROUP]: EntityCategories.VARIABLE_GROUP,
};

export const projectSourceTypeMap = {
  [ProjectSourceType.SETTINGS]: ProjectSourceType.SETTINGS,
  [ProjectSourceType.DEBUGGER]: ProjectSourceType.DEBUGGER,
  [ProjectSourceType.AGENTS]: ProjectSourceType.AGENTS,
  [ProjectSourceType.ISSUES]: ProjectSourceType.ISSUES,
  [ProjectSourceType.END_USERS]: ProjectSourceType.END_USERS,
  [ProjectSourceType.RADAR]: ProjectSourceType.RADAR,
  [ProjectSourceType.FLOWS]: ProjectSourceType.FLOWS,
  [ProjectSourceType.FILE]: EntityCategories.REPOSITORY,
};

export const branchFilterStatuses = {
  [ProjectBranchStatus.DRAFT]: {
    label: "Drafts",
    value: ProjectBranchStatus.DRAFT,
    tag: { bg: "bg.subtle" },
  },
  [ProjectBranchStatus.TO_REVIEW]: {
    label: "In Review",
    value: ProjectBranchStatus.TO_REVIEW,
    tag: { bg: "#FCEECF", color: "yellow.800" },
  },
  [ProjectBranchStatus.IN_DEVELOPMENT]: {
    label: "In Development",
    value: ProjectBranchStatus.IN_DEVELOPMENT,
    tag: { bg: "#ECEFFD" },
  },
  [ProjectBranchStatus.MERGED]: {
    label: "Merged",
    value: ProjectBranchStatus.MERGED,
    tag: { bg: "#ECEFFD" },
  },
};

export const defaultBranchFilterStatuses = [
  ProjectBranchStatus.DRAFT,
  ProjectBranchStatus.TO_REVIEW,
  ProjectBranchStatus.IN_DEVELOPMENT,
];

export const platformComponentDetailsTabs = ["About", "Readme", "Releases"];

export const environmentDetailsTabs = ["About", "Readme"];

export const entityDetails: Record<EntityType, { title: string }> = {
  [EntityType.API]: { title: "API" },
  [EntityType.FILE]: { title: "Source" },
  [EntityType.SKETCH]: { title: "Sketch" },
  [EntityType.EXCALIDRAW]: { title: "Sketch" },
  [EntityType.SCHEMA]: { title: "Schema" },
  [EntityType.NOTEBOOK]: { title: "Document" },
  [EntityType.PLATFORM]: { title: "Platform" },
  [EntityType.PLATFORM_COMPONENT]: { title: "Platform Component" },
  [EntityType.ENVIRONMENT]: { title: "Environment" },
  [EntityType.VARIABLE_GROUP]: { title: "Variables" },
};

export const DiffSupportedEntityTypes = new Set([
  EntityType.PLATFORM,
  EntityType.PLATFORM_COMPONENT,
  EntityType.ENVIRONMENT,
]);

export const navbarExpandedWidth = "220px";

export const projectCategoryConfigs = {
  [ProjectSourceType.SETTINGS]: {
    key: ProjectSourceType.SETTINGS,
    name: "Settings",
    type: NavBarItemType.link,
    sourceType: ProjectSourceType.SETTINGS,
  },
  [ProjectSourceType.RADAR]: {
    key: ProjectSourceType.RADAR,
    name: "System",
    type: NavBarItemType.link,
    sourceType: ProjectSourceType.RADAR,
    featureFlag: FeatureFlag.RADAR,
    entityType: null,
    hasVersioning: true,
  },

  [ProjectSourceType.DEBUGGER]: {
    key: ProjectSourceType.DEBUGGER,
    name: "Recordings",
    featureFlag: FeatureFlag.DEBUG_SESSION,
    sourceType: ProjectSourceType.DEBUGGER,
    navbarWidth: 300,
    showExplorer: false,
    type: NavBarItemType.link,
    entityType: null,
  },

  [ProjectSourceType.AGENTS]: {
    key: ProjectSourceType.AGENTS,
    name: "Agents",
    sourceType: ProjectSourceType.AGENTS,
    featureFlag: FeatureFlag.AGENTS,
    type: NavBarItemType.link,
    entityType: null,
  },

  [ProjectSourceType.ISSUES]: {
    key: ProjectSourceType.ISSUES,
    name: "Issues",
    sourceType: ProjectSourceType.ISSUES,
    featureFlag: FeatureFlag.ISSUES,
    navbarWidth: 300,
    showExplorer: false,
    type: NavBarItemType.link,
    entityType: null,
  },

  [ProjectSourceType.END_USERS]: {
    key: ProjectSourceType.END_USERS,
    name: "Users",
    sourceType: ProjectSourceType.END_USERS,
    featureFlag: FeatureFlag.END_USERS,
    navbarWidth: 300,
    showExplorer: false,
    type: NavBarItemType.link,
    entityType: null,
  },

  [ProjectSourceType.FLOWS]: {
    key: ProjectSourceType.FLOWS,
    name: "Flows",
    navbarWidth: 300,
    showExplorer: false,
    featureFlag: FeatureFlag.FLOWS,
    entityType: null,
  },

  [EntityCategories.PLATFORM]: {
    key: EntityCategories.PLATFORM,
    entityType: EntityType.PLATFORM,
    featureFlag: FeatureFlag.PLATFORM,
    sourceType: ProjectSourceType.ENTITY,
    type: NavBarItemType.link,
    showExplorer: false,
    name: "Platforms",
    button: "Create a platform",
    hasVersioning: true,
    hasDashboard: false,
  },

  [EntityCategories.DOCUMENT]: {
    key: EntityCategories.DOCUMENT,
    sourceType: ProjectSourceType.ENTITY,
    featureFlag: FeatureFlag.NOTEBOOK,
    entityType: EntityType.NOTEBOOK,
    type: NavBarItemType.link,
    hasVersioning: true,
    showExplorer: false,
    name: "Notebooks",
    publicName: "Interactive Notebooks",
    button: "Create a notebook",
    navbarWidth: 300,
    hasDashboard: true,
  },

  [EntityCategories.VARIABLE_GROUP]: {
    key: EntityCategories.VARIABLE_GROUP,
    entityType: EntityType.VARIABLE_GROUP,
    featureFlag: FeatureFlag.VARIABLE_GROUP,
    sourceType: ProjectSourceType.ENTITY,
    type: NavBarItemType.link,
    hasVersioning: true,
    showExplorer: false,
    name: "Variables",
    button: "Create a variable group",
    navbarWidth: 300,
    hasDashboard: true,
  },

  [EntityCategories.SKETCH]: {
    key: EntityCategories.SKETCH,
    entityType: EntityType.EXCALIDRAW,
    featureFlag: FeatureFlag.SKETCH,
    sourceType: ProjectSourceType.ENTITY,
    type: NavBarItemType.link,
    hasVersioning: true,
    showExplorer: false,
    name: "Sketches",
    button: "Create a sketch",
    navbarWidth: 300,
    hasDashboard: true,
  },

  [EntityCategories.COMPONENT]: {
    key: EntityCategories.COMPONENT,
    entityType: EntityType.PLATFORM_COMPONENT,
    sourceType: ProjectSourceType.ENTITY,
    type: NavBarItemType.link,
    hasVersioning: true,
    showExplorer: false,
    name: "Components",
    button: "Create a component",
    navbarWidth: 300,
    hasDashboard: false,
  },

  [EntityCategories.REPOSITORY]: {
    key: EntityCategories.REPOSITORY,
    featureFlag: FeatureFlag.REPOSITORY,
    entityType: null,
    showExplorer: true,
    name: "Repositories",
    button: "Add a repository",
    navbarWidth: 490,
  },

  [EntityCategories.SOURCE]: {
    key: EntityCategories.SOURCE,
    entityType: null,
    name: "APIs",
    button: "Add an API",
    navbarWidth: 300,
    showExplorer: false,
    hasDashboard: false,
  },

  [EntityCategories.ENVIRONMENT]: {
    key: EntityCategories.ENVIRONMENT,
    entityType: EntityType.ENVIRONMENT,
    hasVersioning: true,
    showExplorer: false,
    name: "Environments",
    button: "Create an environment",
    navbarWidth: 300,
    hasDashboard: false,
  },

  [EntityCategories.SCHEMA]: {
    key: EntityCategories.SCHEMA,
    entityType: EntityType.SCHEMA,
    hasVersioning: true,
    showExplorer: false,
    name: "Schemas",
    button: "Create you first schema",
    navbarWidth: 300,
    hasDashboard: false,
  },
};

export const MISSING_SPAN_NAME = "Missing Span";
