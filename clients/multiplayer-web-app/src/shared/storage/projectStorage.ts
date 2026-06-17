import { EntityCategories, ProjectSourceType } from "shared/models/enums";
import { createLRUStorage } from "./lruStorage";

export interface ProjectStorageState {
  activeUrl: string;
  showTabs?: boolean;
  navbarExpanded?: boolean;
  explorerExpanded?: boolean;
  selectedEntityCategory?: EntityCategories | ProjectSourceType;
}

const defaultState: ProjectStorageState = {
  activeUrl: "",
  showTabs: false,
  navbarExpanded: true,
  explorerExpanded: false,
  selectedEntityCategory: ProjectSourceType.ENTITY,
};

const projectStorage = createLRUStorage({
  maxEntries: 5,
  maxSizeBytes: 1024 * 1024, // 1MB
  storageKey: 'projectCache',
  prevStorageKey: 'projectState',
});

export const getProjectCache = () => {
  return projectStorage.get();
};

export const getProjectLastVisitedPath = (cacheKey: string): string => {
  try {
    const projectData = projectStorage.getEntry(cacheKey);

    if (!projectData || typeof projectData !== 'object') {
      return '';
    }

    const activeUrl = projectData.activeUrl || '';
    return activeUrl.replace('/public', '');
  } catch (error) {
    console.warn('Failed to get project last visited path:', error);
    return '';
  }
};

export const setProjectStateCache = (cacheKey: string, state: Partial<ProjectStorageState>): void => {
  projectStorage.set(cacheKey, state);
};

export const getProjectStateCache = (cacheKey: string): ProjectStorageState => {
  const cached = projectStorage.getEntry(cacheKey);

  if (!cached || typeof cached !== 'object') {
    return defaultState;
  }

  return { ...defaultState, ...cached, showTabs: false };
};



export const clearOldCacheEntries = (maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): void => {
  projectStorage.clearOldEntries(maxAgeMs);
};

export const getCacheStats = (): { entries: number; sizeBytes: number } => {
  return projectStorage.getStats();
};
