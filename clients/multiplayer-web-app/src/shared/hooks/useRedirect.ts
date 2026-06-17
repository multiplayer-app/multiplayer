import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface UseRedirectReturn {
  saveRedirect: () => void;
  getRedirect: () => string | null;
  clearRedirect: () => void;
  navigateToRedirect: (fallbackPath?: string) => void;
  setRedirect: (path: string) => void;
}

export const useRedirect = (): UseRedirectReturn => {
  const navigate = useNavigate();

  const saveRedirect = useCallback(() => {
    const fullPath = window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem("redirectTo", fullPath);
  }, []);

  const getRedirect = useCallback((): string | null => {
    return localStorage.getItem("redirectTo");
  }, []);

  const clearRedirect = useCallback(() => {
    localStorage.removeItem("redirectTo");
  }, []);

  const setRedirect = useCallback((path: string) => {
    localStorage.setItem("redirectTo", path);
  }, []);

  const navigateToRedirect = useCallback((fallbackPath: string = "/") => {
    const redirectTo = getRedirect();
    if (redirectTo) {
      clearRedirect();
      navigate(redirectTo);
    } else {
      navigate(fallbackPath);
    }
  }, [getRedirect, clearRedirect, navigate]);

  return {
    saveRedirect,
    getRedirect,
    clearRedirect,
    navigateToRedirect,
    setRedirect,
  };
};