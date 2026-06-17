import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import SessionRecorder, {
  UserType,
} from "@multiplayer-app/session-recorder-react";
import { useLocation } from "react-router-dom";
import * as AuthService from "shared/services/auth.service";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { IUserSession } from "@multiplayer/types";
import {
  getCurrentSessionId,
  setCurrentSessionId,
  setAccessToken,
} from "shared/api";
import { useVsCode } from "vscode/VsCodeContext";
import { config } from "../../config";

interface IAuthContext {
  userId: string;
  user: IUserSession;
  sessions: IUserSession[];
  loading: boolean;
  authorized: boolean;
  signOut: (redirect?: string) => Promise<void>;
  signIn: (email?: string) => Promise<IUserSession>;
  setLoading: (arg: boolean) => void;
  updateSessions: () => Promise<IUserSession[]>;
  clearAuthData: () => void;
  setSession: (arg: IUserSession) => void;
  setSessions: React.Dispatch<React.SetStateAction<IUserSession[]>>;
}

export const AuthContext = createContext<IAuthContext | null>(null);

export const AuthProvider = ({ children }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const { identifyPosthogUser, resetPosthogUser } = useAnalytics();
  const {
    state: { accessToken },
  } = useVsCode();

  const signIn = async (email?: string) => {
    return getUserAndSessions(email);
  };

  const clearAuthData = useCallback(() => {
    setCurrentSessionId(null);
    setAuthorized(false);
    setSessions(null);
  }, []);

  const updateSessions = useCallback(async () => {
    try {
      const { sessions } = await AuthService.getUserSession();
      setSessions(sessions);
      return sessions;
    } catch (error) {
      clearAuthData();
    }
  }, [clearAuthData]);

  const signOut = useCallback(
    async (redirectTo?: string) => {
      try {
        await AuthService.signOut();
        resetPosthogUser();
      } catch (error) {
        console.warn("Auth error!");
      }
      if (redirectTo) {
        localStorage.setItem("redirectTo", redirectTo);
      }
      clearAuthData();
    },
    [clearAuthData]
  );

  const getUserAndSessions = useCallback(
    async (email?: string) => {
      try {
        const query = new URLSearchParams(location.search);
        const signInMethod = query.get("signInMethod");
        const { sessions } = await AuthService.getUserSession();
        const currentSession = getSession({
          email,
          sessions,
          signInMethod,
          path: location.pathname,
        });
        if (!currentSession) {
          throw new Error("No session found");
        }
        setCurrentSessionId(currentSession._id);
        setSessions(sessions);
        setAuthorized(true);
        const { primaryEmail, _id, firstName, lastName } = currentSession;
        identifyPosthogUser({
          id: _id,
          email: primaryEmail,
          lastName: lastName,
          firstName: firstName,
          signInMethod: signInMethod,
        });
        setLoading(false);
        return currentSession;
      } catch (error) {
        clearAuthData();
        setLoading(false);
      }
    },
    [clearAuthData]
  );

  const setSession = useCallback((session: IUserSession) => {
    setCurrentSessionId(session._id);
    setSessions((prev) => [...prev]);
    setAuthorized(true);
  }, []);

  useEffect(() => {
    getUserAndSessions();
  }, [getUserAndSessions]);

  const user = useMemo(() => {
    const currentSession = getCurrentSessionId();
    return sessions?.find((s) => s._id === currentSession) || null;
  }, [sessions]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user) {
        setSession(user);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      const { firstName, lastName, primaryEmail, _id } = user;
      const userName =
        firstName && lastName ? firstName + " " + lastName : primaryEmail;
      SessionRecorder.setSessionAttributes({
        userId: primaryEmail,
        userName: userName,
      });
      SessionRecorder.setUserAttributes({
        type: UserType.USER,
        id: user._id,
        name: userName,
        userName: userName,
        userEmail: primaryEmail,
        orgId: "multiplayer",
        orgName: "Multiplayer",
        environment: config.REACT_APP_PLATFORM_ENV,
      });
    } else {
      SessionRecorder.setSessionAttributes({});
      SessionRecorder.setUserAttributes(null);
    }
  }, [user]);

  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);

  const userId = useMemo(() => {
    return user ? user._id : "guest";
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        loading,
        authorized,
        sessions,
        setLoading,
        signIn,
        signOut,
        setSession,
        setSessions,
        clearAuthData,
        updateSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

function getSession({
  path,
  sessions,
  email,
  signInMethod,
}: {
  path: string;
  email?: string;
  signInMethod?: string;
  sessions: IUserSession[];
}): IUserSession | null {
  const [_, page, workspaceId] = path.split("/");
  const localSessionId = getCurrentSessionId();
  if (email) {
    const session = sessions.find((s) => s.primaryEmail === email);
    return session || null;
  }
  if (signInMethod) {
    const session = sessions.find(
      (s) => s.primaryEmailSource === signInMethod.toUpperCase()
    );
    if (session) {
      return session;
    }
  }
  const workspacePaths = new Set(["dashboard", "project"]);
  const localSession = sessions.find((s) => s._id === localSessionId);

  if (workspacePaths.has(page) && workspaceId?.length === 24) {
    if (
      localSession &&
      localSession.workspaces.some((w) => w._id === workspaceId)
    ) {
      return localSession;
    }

    for (const session of sessions) {
      for (const workspace of session.workspaces) {
        if (workspace._id === workspaceId) {
          return session;
        }
      }
    }
  }

  if (localSession) {
    return localSession;
  }

  return sessions[0] || null;
}
