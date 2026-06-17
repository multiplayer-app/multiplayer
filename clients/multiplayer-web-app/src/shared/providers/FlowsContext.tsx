import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import {
  IFlowMetadata,
  IIntegration,
  IntegrationTypeEnum,
} from "@multiplayer/types";
import { IListRes } from "shared/models/interfaces";
import useMessage from "shared/hooks/useMessage";
import {
  getFlows,
  updateFlow,
  deleteFlow,
} from "shared/services/radar.service";
import { useTabs } from "./TabsContext";
import { useIntegrations } from "./IntegrationsContext";
import { UseDisclosureReturn } from "@chakra-ui/react";
import { useAlertDialog } from "./AlertDialogContext";

interface IFlowsContext {
  flows: IListRes<IFlowMetadata>;
  integrations: IIntegration[];
  observabilityModal: UseDisclosureReturn;

  getData: (params: any) => Promise<void>;
  onUpdate: (id: string, flow: Partial<IFlowMetadata>) => any;
  onDelete: (id: string) => Promise<void>;
}

const FlowsContext = createContext<IFlowsContext | null>(null);

const FlowsProvider = ({ children }: { children: ReactNode }) => {
  const message = useMessage();
  const { closeTabById, setTabs } = useTabs();
  const { openAlertDialog } = useAlertDialog();

  const { workspaceId, projectId } = useParams();
  const { integrations: all, observabilityModal } = useIntegrations();

  const [flows, setFlows] = useState<IListRes<IFlowMetadata>>({
    cursor: { skip: null, limit: 100, total: 0 },
    data: [] as IFlowMetadata[],
  });

  const getData = useCallback(
    async (params = { skip: 0, limit: 50 }) => {
      try {
        const res = await getFlows(workspaceId, projectId, params);
        setFlows((prev) => ({
          cursor: res.cursor,
          data: params.skip ? [...prev.data, ...res.data] : res.data,
        }));
      } catch (err) {
        message.handleError(err);
      }
    },
    [workspaceId, projectId, message]
  );

  const onUpdate = async (id: string, payload: Partial<IFlowMetadata>) => {
    try {
      const flow = await updateFlow(workspaceId, projectId, id, payload);
      setFlows(({ cursor, data }) => ({
        cursor,
        data: data.map((f) => (f.id === flow.id ? flow : f)),
      }));

      if (payload.name) {
        setTabs((prev) =>
          prev.map((t) => (t._id === id ? { ...t, key: flow.name } : t))
        );
      }
      return flow;
    } catch (err) {
      message.handleError(err);
    }
  };

  const onDelete = async (id: string) => {
    const result = await openAlertDialog({ title: "Delete" });
    if (!result) return;
    try {
      await deleteFlow(workspaceId, projectId, id);
      setFlows(({ cursor, data }) => ({
        cursor,
        data: data.filter((f) => f.id !== id),
      }));
      closeTabById(id);
    } catch (err) {
      message.handleError(err);
    }
  };

  const integrations = useMemo(() => {
    return all.get(IntegrationTypeEnum.OTEL);
  }, [all]);

  return (
    <FlowsContext.Provider
      value={{
        flows,
        integrations,
        observabilityModal,
        getData,
        onUpdate,
        onDelete,
      }}
    >
      {children}
    </FlowsContext.Provider>
  );
};

export function useFlows() {
  const context = useContext(FlowsContext);
  if (context === null) {
    throw new Error("useFlows must be used within FlowsProvider");
  }
  return context;
}

export { FlowsProvider };
