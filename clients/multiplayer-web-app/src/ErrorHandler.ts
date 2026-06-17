import { useEffect } from "react";
import { AxiosInstance } from "axios";
import { useNavigate } from "react-router-dom";
import { useRedirect } from "shared/hooks/useRedirect";
import { useAuth } from "shared/providers/AuthContext";
import { useSocket } from "shared/providers/SocketContext";
import {
  apiInstance,
  gitInstance,
  radarInstance,
  assetsInstance,
  versionInstance,
  notebookInstance,
} from "shared/api";

const ErrorHandler = () => {
  const navigate = useNavigate();
  const { subscribe } = useSocket();
  const { clearAuthData } = useAuth();
  const { saveRedirect } = useRedirect();

  useEffect(() => {
    const handleAuthError = (error) => {
      if (
        error &&
        error.code === 401 &&
        !window.location.pathname.startsWith("/auth") &&
        !window.location.pathname.startsWith("/public/")
      ) {
        saveRedirect();
        navigate({ pathname: "/auth", search: window.location.search });
        clearAuthData();
      }
    };

    const handlePlanLimitationError = (error) => {
      if (error && error.statusCode === 402) {
        error.isHandled = true;
        // showProFeaturePopup();
      }
    };

    const errorHandler = (error) => {
      handleAuthError(error);
      handlePlanLimitationError(error);
      return Promise.reject(error);
    };

    const instances = [
      apiInstance,
      gitInstance,
      radarInstance,
      assetsInstance,
      versionInstance,
      notebookInstance,
    ];

    const interceptors: [AxiosInstance, number][] = instances.map(
      (instance) => [
        instance,
        instance.interceptors.response.use(undefined, errorHandler),
      ]
    );

    return () => {
      interceptors.forEach(([instance, interceptor]) => {
        instance.interceptors.response.eject(interceptor);
      });
    };
  }, [clearAuthData, subscribe, navigate]);

  return null;
};

export default ErrorHandler;
