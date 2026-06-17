import { createContext, useContext } from "react";
import { IProject } from "@multiplayer/types";

interface ProjectSettingsContextValue {
  workspaceId: string;
  projectId: string;
  project: IProject;
  onUpdate: () => Promise<void>;
}

export const ProjectSettingsContext =
  createContext<ProjectSettingsContextValue | null>(null);

export const useProjectSettings = () => {
  const ctx = useContext(ProjectSettingsContext);
  if (!ctx) {
    throw new Error(
      "useProjectSettings must be used within ProjectSettingsContext"
    );
  }
  return ctx;
};
