import { IAlertRule } from "@multiplayer/types";
import { useParams, useSearchParams } from "react-router-dom";
import { createContext, useCallback, useContext, useState } from "react";

import useMessage from "shared/hooks/useMessage";
import {
  AlertRulePayload,
  createAlertRule as createAlertRuleApi,
  getAlertRule as getAlertRuleApi,
  listAlertRules as listAlertRulesApi,
  removeAlertRule as removeAlertRuleApi,
  updateAlertRule as updateAlertRuleApi,
} from "shared/services/radar.service";
import { IListRes, IReqParamsSortable } from "shared/models/interfaces";

interface IAlertRulesStateContext {
  alertsLoading: boolean;
  alertRules: IListRes<IAlertRule> | null;
  workspaceId?: string;
  projectId?: string;
  setProjectId: (projectId: string | undefined) => void;
  listAlertRules: (params: IReqParamsSortable) => Promise<IListRes<IAlertRule>>;
  getAlertRule: (alertRuleId: string) => Promise<IAlertRule>;
  createAlertRule: (body: AlertRulePayload) => Promise<IAlertRule>;
  updateAlertRule: (
    alertRuleId: string,
    body: Partial<AlertRulePayload>
  ) => Promise<IAlertRule>;
  removeAlertRule: (alertRuleId: string) => Promise<void>;
}

export const AlertRulesContext = createContext<IAlertRulesStateContext | null>(
  null
);

export const AlertRulesProvider = ({ children }) => {
  const message = useMessage();
  const { workspaceId, projectId: routeProjectId } = useParams();
  const [searchParams] = useSearchParams();
  const initialProjectId =
    searchParams.get("projectId") ?? routeProjectId ?? undefined;
  const [projectId, setProjectId] = useState<string | undefined>(
    initialProjectId
  );

  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertRules, setAlertRules] = useState<IListRes<IAlertRule> | null>(
    null
  );

  const listAlertRules = useCallback(
    async (params: IReqParamsSortable) => {
      setAlertsLoading(true);
      try {
        const res = await listAlertRulesApi(workspaceId, projectId, params);
        setAlertRules(res);
        return res;
      } catch (err) {
        message.handleError(err);
        throw err;
      } finally {
        setAlertsLoading(false);
      }
    },
    [workspaceId, projectId, message]
  );

  const getAlertRule = useCallback(
    async (alertRuleId: string) => {
      return getAlertRuleApi(workspaceId, projectId, alertRuleId);
    },
    [workspaceId, projectId]
  );

  const createAlertRule = useCallback(
    async (body: AlertRulePayload) => {
      return createAlertRuleApi(workspaceId, projectId, body);
    },
    [workspaceId, projectId]
  );

  const updateAlertRule = useCallback(
    async (alertRuleId: string, body: Partial<AlertRulePayload>) => {
      return updateAlertRuleApi(workspaceId, projectId, alertRuleId, body);
    },
    [workspaceId, projectId]
  );

  const removeAlertRule = useCallback(
    async (alertRuleId: string) => {
      return removeAlertRuleApi(workspaceId, projectId, alertRuleId);
    },
    [workspaceId, projectId]
  );

  return (
    <AlertRulesContext.Provider
      value={{
        alertsLoading,
        alertRules,
        projectId,
        setProjectId,
        listAlertRules,
        getAlertRule,
        createAlertRule,
        updateAlertRule,
        removeAlertRule,
      }}
    >
      {children}
    </AlertRulesContext.Provider>
  );
};

export function useAlertRules() {
  const context = useContext(AlertRulesContext);
  if (context === null) {
    throw new Error("useAlertRules must be used within AlertRulesProvider");
  }
  return context;
}
