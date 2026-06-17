import {
  IIntegration,
  IntegrationTypeEnum,
  IProject,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { useParams } from "react-router-dom";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useMessage from "shared/hooks/useMessage";
import { fetchAllData } from "shared/helpers/api.helpers";
import * as GitService from "shared/services/git.service";
import * as WorkspaceService from "shared/services/workspace.service";
import ObservabilitySetupModal from "shared/components/ObservabilitySetupModal";
import ObservabilityUpdateModal from "shared/components/ObservabilityUpdateModal";
import { useDisclosure, UseDisclosureReturn } from "@chakra-ui/react";
import { useWorkspace } from "./WorkspaceContext";
import { PostHogEvents } from "shared/models/enums";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { useMobileExperienceModal } from "shared/hooks/useMobileExperienceModal";
import { usePermissions } from "./PermissionsContext";

type IntegrationsState = Map<IntegrationTypeEnum, IIntegration[]>;

type CreateIntegrationBody = Parameters<typeof GitService.createIntegration>[0];
type UpdateIntegrationBody = Parameters<typeof GitService.updateIntegration>[1];

interface IIntegrationsStateContext {
  projects: IProject[];
  integrations: IntegrationsState;
  isIntegrationsLoaded: boolean;
  observabilityModal: UseDisclosureReturn;
  onDelete: (type: IntegrationTypeEnum, id: string) => Promise<void>;
  createIntegration: (body: CreateIntegrationBody) => Promise<any>;
  updateIntegration: (
    type: IntegrationTypeEnum,
    integrationId: string,
    body: UpdateIntegrationBody
  ) => Promise<void>;
  updateIntegrations: () => void;
  onShowObservabilityModal: (isOpenedManually?: boolean) => void;
  onShowObservabilityUpdateModal: () => void;
}

export const IntegrationsProvider = ({ children }) => {
  const message = useMessage();
  const { isPublic } = useWorkspace();
  const { trackEvent } = useAnalytics();
  const { hasAccess } = usePermissions();
  const observabilityModal = useDisclosure();
  const { workspaceId, projectId } = useParams();
  const activeProjectIdRef = useRef(projectId);
  activeProjectIdRef.current = projectId;
  const observabilityUpdateModal = useDisclosure();
  const [loading, setLoading] = useState(!isPublic);
  const [integrations, setIntegrations] = useState<IntegrationsState>(
    new Map()
  );
  const { isMobileViewport, onOpen: onMobileExperienceModalOpen } =
    useMobileExperienceModal();

  const [projects, setProjects] = useState<IProject[]>([]);

  const { canReadWorkspaceIntegrations, canReadProjectIntegrations } =
    useMemo(() => {
      return {
        canReadWorkspaceIntegrations: hasAccess(
          RoleWorkspacePermissionEntity.INTEGRATION,
          RoleAccessAction.READ,
          RoleType.WORKSPACE
        ),
        canReadProjectIntegrations: hasAccess(
          RoleProjectPermissionEntity.INTEGRATION,
          RoleAccessAction.READ,
          RoleType.PROJECT
        ),
      };
    }, [hasAccess]);

  const fetchIntegrations = useCallback(
    async (project?: string) => {
      try {
        const res = await GitService.getIntegrations({
          skip: null,
          limit: 100,
          project,
        });
        setIntegrations((prev) => {
          if (project !== undefined && project !== activeProjectIdRef.current) {
            return prev;
          }

          const base = new Map<IntegrationTypeEnum, IIntegration[]>();

          if (project) {
            for (const [type, list] of prev) {
              const workspaceOnly = list.filter((i) => !i.project);
              if (workspaceOnly.length > 0) {
                base.set(type, workspaceOnly);
              }
            }
          } else {
            for (const [type, list] of prev) {
              const projectScoped = list.filter((i) => i.project);
              if (projectScoped.length > 0) {
                base.set(type, projectScoped);
              }
            }
          }

          return res.data.reduce<Map<IntegrationTypeEnum, IIntegration[]>>(
            (acc, item) => {
              if (!project && item.project) {
                return acc;
              }
              if (acc.get(item.type)) {
                acc.set(item.type, [...acc.get(item.type)!, item]);
              } else {
                acc.set(item.type, [item]);
              }
              return acc;
            },
            base
          );
        });
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    },
    [workspaceId]
  );

  const fetchWorkspaceProjects = useCallback(async () => {
    if (workspaceId) {
      try {
        const res = await fetchAllData<IProject>(
          WorkspaceService.getWorkspaceProjects.bind(null, workspaceId)
        );
        setProjects(res);
      } catch (error) {
        console.log(error);
      }
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!isPublic) {
      fetchWorkspaceProjects();
    }
  }, [fetchWorkspaceProjects, isPublic]);

  useEffect(() => {
    if (!isPublic) {
      if (projectId && canReadProjectIntegrations) {
        fetchIntegrations(projectId);
      }

      if (canReadWorkspaceIntegrations) {
        fetchIntegrations();
      }
    }
  }, [
    fetchIntegrations,
    isPublic,
    projectId,
    canReadProjectIntegrations,
    canReadWorkspaceIntegrations,
  ]);

  const onDelete = async (type: IntegrationTypeEnum, id: string) => {
    try {
      await GitService.deleteIntegration(id);
      setIntegrations((prev) => {
        const next = new Map(prev);
        const list = next.get(type);
        if (!list) return prev;
        const filtered = list.filter((i) => i._id !== id);
        if (filtered.length === 0) {
          next.delete(type);
        } else {
          next.set(type, filtered);
        }
        return next;
      });
    } catch (error) {
      message.handleError(error);
      throw error;
    }
  };

  const createIntegration = useCallback(
    async (body: CreateIntegrationBody) => {
      try {
        const res = await GitService.createIntegration(body);
        const intType = body.type as IntegrationTypeEnum;
        setIntegrations((prev) => {
          const next = new Map(prev);
          const list = next.get(intType) || [];
          next.set(intType, [...list, res]);
          return next;
        });
        return res;
      } catch (error) {
        message.handleError(error);
        throw error;
      }
    },
    [message]
  );

  const updateIntegration = useCallback(
    async (
      intType: IntegrationTypeEnum,
      integrationId: string,
      body: UpdateIntegrationBody
    ) => {
      setIntegrations((prev) => {
        const next = new Map(prev);
        const list = next.get(intType);
        if (!list) return prev;
        next.set(
          intType,
          list.map((i) => {
            if (i._id !== integrationId) return i;
            if (body.otel) {
              return {
                ...i,
                ...body,
                otel: { ...i.otel, ...body.otel },
              };
            }
            return { ...i, ...body };
          })
        );
        return next;
      });
      try {
        await GitService.updateIntegration(integrationId, body);
      } catch (error) {
        message.handleError(error);
        await fetchIntegrations();
        throw error;
      }
    },
    [fetchIntegrations, message]
  );

  const onShowObservabilityModal = (isOpenedManually = true) => {
    if (isMobileViewport()) {
      onMobileExperienceModalOpen();
      return;
    }
    if (isOpenedManually) {
      trackEvent(PostHogEvents.ONBOARDING_WIZARD_MANUALLY_OPENED, {});
    }
    observabilityModal.onOpen();
  };

  const onShowObservabilityUpdateModal = () => {
    observabilityUpdateModal.onOpen();
  };

  return (
    <IntegrationsContext.Provider
      value={{
        projects,
        integrations,
        observabilityModal,
        isIntegrationsLoaded: !loading,
        onDelete,
        createIntegration,
        updateIntegration,
        onShowObservabilityModal,
        onShowObservabilityUpdateModal,

        updateIntegrations: fetchIntegrations,
      }}
    >
      {children}

      {!!projectId && (
        <>
          <ObservabilitySetupModal
            disclosure={observabilityModal}
            onCloseComplete={fetchIntegrations}
          />
          <ObservabilityUpdateModal
            disclosure={observabilityUpdateModal}
            onCloseComplete={() => {
              fetchIntegrations();
            }}
          />
        </>
      )}
    </IntegrationsContext.Provider>
  );
};

export const IntegrationsContext =
  createContext<IIntegrationsStateContext | null>(null);

export function useIntegrations() {
  const context = useContext(IntegrationsContext);
  if (context === null) {
    throw new Error("useIntegrations must be used within IntegrationsProvider");
  }
  return context;
}

export function useOtelIntegrations() {
  const {
    integrations: all,
    isIntegrationsLoaded,
    onShowObservabilityModal,
    onShowObservabilityUpdateModal,
  } = useIntegrations();

  const integrations = useMemo(
    () => all.get(IntegrationTypeEnum.OTEL),
    [all]
  );

  return {
    integrations,
    isIntegrationsLoaded,
    onShowObservabilityModal,
    onShowObservabilityUpdateModal,
  };
}
