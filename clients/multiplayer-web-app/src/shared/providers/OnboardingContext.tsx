import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import OnboardingLoading from "shared/components/OnboardingLoading";
import * as WorkspaceService from "shared/services/workspace.service";
import { useAuth } from "shared/providers/AuthContext";
import { OnboardingStateEnum } from "shared/models/enums";

interface IOnboardingContext {
  isOnboarding: boolean;
  setIsOnboarding: (value: boolean) => void;
  createSampleWorkspace: () => void;
}

const OnboardingContext = createContext<IOnboardingContext>(null);

export const OnboardingProvider = ({ children }) => {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingState, setOnboardingState] =
    useState<OnboardingStateEnum>(null);
  const { updateSessions } = useAuth();
  const navigate = useNavigate();

  const createSampleWorkspace = async () => {
    if (isOnboarding) return;
    setIsOnboarding(true);

    const body = {
      name: "Main workspace",
      handle: "main-workspace",
    };
    setOnboardingState(OnboardingStateEnum.WorkspaceSetup);
    const workspace = await WorkspaceService.createWorkspace(body);

    setOnboardingState(OnboardingStateEnum.ProjectSetup);
    const project = await WorkspaceService.createProject(workspace._id, {
      name: "Main project",
    });
    await updateSessions();
    setIsOnboarding(false);
    setOnboardingState(OnboardingStateEnum.Done);

    navigate(`/project/${workspace._id}/${project._id}/default`);
  };

  return (
    <OnboardingContext.Provider
      value={{ isOnboarding, setIsOnboarding, createSampleWorkspace }}
    >
      {isOnboarding && <OnboardingLoading state={onboardingState} />}
      {children}
    </OnboardingContext.Provider>
  );
};

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === null) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
