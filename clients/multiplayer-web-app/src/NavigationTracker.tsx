import { useLocation, useNavigationType } from "react-router-dom";
import { useNavigationRecorder } from "@multiplayer-app/session-recorder-react";

export function NavigationTracker() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useNavigationRecorder(location.pathname, {
    navigationType,
    params: location.state as Record<string, unknown> | undefined,
  });

  return null;
}
