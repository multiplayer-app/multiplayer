import { ObjectTypeEnum, IFlow, IFlowMetadata } from "@multiplayer/types";
import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import EmptyScreen from "shared/components/EmptyScreen";
import PageLoading from "shared/components/PageLoading";
import useMessage from "shared/hooks/useMessage";
import { getFlow } from "shared/services/radar.service";
import { ReactComponent as FlowsIntroIcon } from "assets/icons/flows-intro.svg";
import { useDisclosure, UseDisclosureReturn } from "@chakra-ui/react";
import { ThreadsProvider } from "shared/providers/ThreadsContext";
import ComponentNode from "shared/components/Editors/PixiDiagram/Editor/components/ComponentNode";

interface IFlowContext {
  flow: IFlow;
  metadata: IFlowMetadata;
  activeComponent: any;
  openComponentDetails: (n: any) => void;
  setMetadata: React.Dispatch<React.SetStateAction<IFlowMetadata>>;
  componentDetailsDrawerDisclosure: UseDisclosureReturn;
  flowPropertiesDrawerDisclosure: UseDisclosureReturn;
}

const FlowContext = createContext<IFlowContext | null>(null);

const FlowProvider = ({ children }: { children: ReactNode }) => {
  const message = useMessage();
  const flowPropertiesDrawerDisclosure = useDisclosure();
  const componentDetailsDrawerDisclosure = useDisclosure();
  const { workspaceId, projectId, path: flowId } = useParams();
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<IFlowMetadata>(null);
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  useEffect(() => {
    if (!componentDetailsDrawerDisclosure.isOpen) {
      setActiveComponent(null);
    }
  }, [componentDetailsDrawerDisclosure.isOpen]);

  useEffect(() => {
    flowPropertiesDrawerDisclosure.onClose();
    componentDetailsDrawerDisclosure.onClose();
    setActiveComponent(null);
  }, [flowId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getFlow(workspaceId, projectId, flowId);
        setFlow(res.flow);
        setMetadata(res.metadata);
      } catch (error) {
        message.handleError(error);
      }
      setLoading(false);
    };
    if (flowId) {
      fetchData();
    }
  }, [workspaceId, projectId, flowId]);

  const openComponentDetails = (node: any) => {
    if (node instanceof ComponentNode) {
      const data = node.toJson();
      if (!data.linkedTo) return;
      setActiveComponent(data.linkedTo);
      componentDetailsDrawerDisclosure.onOpen();
      if (flowPropertiesDrawerDisclosure.isOpen) {
        flowPropertiesDrawerDisclosure.onClose();
      }
    }
  };

  return (
    <FlowContext.Provider
      value={{
        flow,
        metadata,
        activeComponent,
        setMetadata,
        openComponentDetails,
        flowPropertiesDrawerDisclosure,
        componentDetailsDrawerDisclosure,
      }}
    >
      {loading ? (
        <PageLoading />
      ) : flow ? (
        <ThreadsProvider
          objectId={metadata._id}
          objectType={ObjectTypeEnum.FLOW_METADATA}
        >
          {children}
        </ThreadsProvider>
      ) : (
        <EmptyScreen
          mx="auto"
          maxW="460px"
          icon={<FlowsIntroIcon />}
          title="Flow Not Available"
          description="We're unable to display the flow at the moment. It may be missing, deleted, or unavailable due to some internal reasons. Please try again later or contact support if the issue persists."
        />
      )}
    </FlowContext.Provider>
  );
};

export function useFlow() {
  const context = useContext(FlowContext);
  if (context === null) {
    throw new Error("useFlow must be used within FlowProvider");
  }
  return context;
}

export { FlowProvider };
