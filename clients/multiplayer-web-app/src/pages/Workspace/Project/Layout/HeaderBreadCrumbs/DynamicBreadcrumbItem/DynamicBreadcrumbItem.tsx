import {
  IDebugSession,
  IFlowMetadata,
  IIssue,
  IUser,
  IAgent,
  IAgentChat,
} from "@multiplayer/types";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Text } from "@chakra-ui/react";
import {
  getAgentSession,
  getDebugSession,
  getEndUser,
  getFlow,
  getIssueByTitleHash,
} from "shared/services/radar.service";
import { useEventSubscription } from "shared/hooks/useEventSubscription";
import { ProjectSourceType } from "shared/models/enums";
import { getDefaultTitle } from "shared/components/IssueInfo";
import { getAgentSessionDisplayTitle } from "pages/Workspace/Project/Agents/AgentSessionInfo";

interface DynamicBreadcrumbItemProps {
  path: string;
  sourceType: ProjectSourceType;
}

type IEndUser = IUser & { attributes: any };

const DynamicBreadcrumbItem = ({
  path,
  sourceType,
}: DynamicBreadcrumbItemProps) => {
  const { workspaceId, projectId } = useParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<
    IDebugSession | IFlowMetadata | IIssue | IEndUser | IAgent | IAgentChat
  >(null);

  // Subscribe to updates for session and flow types
  useEventSubscription(
    sourceType,
    path,
    (updatedData: IDebugSession | IFlowMetadata | IIssue | IAgent) => {
      setData(updatedData);
    },
    [path, sourceType]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        let result;
        switch (sourceType) {
          case ProjectSourceType.DEBUGGER:
            result = await getDebugSession(workspaceId, projectId, path);
            break;
          case ProjectSourceType.AGENTS:
            result = await getAgentSession(workspaceId, projectId, path);
            break;
          case ProjectSourceType.FLOWS:
            const flowData = await getFlow(workspaceId, projectId, path);
            result = flowData.metadata;
            break;
          case ProjectSourceType.ISSUES:
            result = await getIssueByTitleHash(workspaceId, projectId, path);
            break;
          case ProjectSourceType.END_USERS:
            result = await getEndUser(workspaceId, projectId, path);
            break;
          default:
            throw new Error(`Unsupported breadcrumb type: ${sourceType}`);
        }
        setData(result);
        setLoading(false);
      } catch (error) {
        setData(null);
        setLoading(false);
      }
    };

    if (path) {
      fetchData();
    }
  }, [path, sourceType, workspaceId, projectId]);

  if (loading) return <>...</>;
  if (!data) {
    const errorMessages = {
      [ProjectSourceType.FLOWS]: "Flow not found",
      [ProjectSourceType.ISSUES]: "Issue not found",
      [ProjectSourceType.DEBUGGER]: "Recording not found",
      [ProjectSourceType.AGENTS]: "Session not found",
    };
    const errorMessage = errorMessages[sourceType];
    return errorMessage ? <>{errorMessage}</> : null;
  }

  // Extract display name based on type
  const getDisplayName = () => {
    switch (sourceType) {
      case ProjectSourceType.DEBUGGER:
        return (data as IDebugSession).name;
      case ProjectSourceType.AGENTS:
        return getAgentSessionDisplayTitle(data as IAgentChat);
      case ProjectSourceType.FLOWS:
        return (data as IFlowMetadata).name;
      case ProjectSourceType.ISSUES:
        return getDefaultTitle(
          (data as IIssue).title,
          (data as IIssue).metadata
        );
      case ProjectSourceType.END_USERS:
        return (data as IEndUser)?.attributes?.name;
      default:
        return "";
    }
  };
  const displayName = getDisplayName();
  return (
    <Text as="span">
      {displayName}
    </Text>
  );
};

export default DynamicBreadcrumbItem;
