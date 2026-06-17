import { createContext, useContext } from "react";
import { useParams } from "react-router-dom";
import posthog from "posthog-js";

import { detectDeviceAndOS } from "shared/helpers/deviceDetector.helpers";

interface IAnalyticsContext {
  trackEvent: (eventName: string, properties: any) => void;
  identifyPosthogUser: ({
    email,
    id,
    firstName,
    lastName,
    signInMethod,
  }) => void;
  resetPosthogUser: () => void;
}

const AnalyticsContext = createContext<IAnalyticsContext>(null);

export const AnalyticsProvider = ({ children }) => {
  const { deviceType, os } = detectDeviceAndOS();
  const { workspaceId } = useParams();

  const trackEvent = (eventName: string, properties: any) => {
    posthog.capture(eventName, {
      workspaceId,
      operationSystem: os,
      deviceType,
      ...properties,
    });
  };

  const identifyPosthogUser = ({
    email,
    id,
    firstName,
    lastName,
    signInMethod,
  }): void => {
    posthog.identify(id, { email, firstName, lastName, signInMethod });
  };

  const resetPosthogUser = (): void => {
    posthog.reset();
  };

  return (
    <AnalyticsContext.Provider
      value={{ trackEvent, identifyPosthogUser, resetPosthogUser }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === null) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
}
