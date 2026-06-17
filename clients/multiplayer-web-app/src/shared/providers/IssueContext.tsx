import { IIssue } from "@multiplayer/types";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import {
  getIssue,
  getIssueByComponentHash,
  getIssueByTitleHash,
  updateIssuesBulk,
} from "shared/services/radar.service";
import useMessage from "shared/hooks/useMessage";
import { useIssuesOptional } from "./IssuesContext";
import { useDisclosure, UseDisclosureReturn } from "@chakra-ui/react";
import { useVsCode } from "vscode/VsCodeContext";
import { ISSUE_HASH_KEY } from "shared/configs/issues.configs";

interface IIssueContext {
  issue: IIssue | null;
  loading: boolean;
  detailsDrawerDisclosure: UseDisclosureReturn;
  selectedEvent: any;
  setSelectedEvent: React.Dispatch<any>;
  updateIssue: (body: Partial<IIssue>) => Promise<void>;
}

const IssueContext = createContext<IIssueContext | null>(null);

const IssueProvider = ({
  children,
  initialIssue,
  identity,
  identityKey,
}: {
  children: ReactNode;
  initialIssue?: IIssue | null;
  identity?: string;
  identityKey?: "_id" | "titleHash" | "componentHash" | "customHash";
}) => {
  const message = useMessage();
  const { sendMessage } = useVsCode();
  const issuesList = useIssuesOptional();
  const hydratedFromInitial = Boolean(
    initialIssue &&
      identity &&
      String(initialIssue?.[identityKey] ?? "") === String(identity)
  );
  const [loading, setLoading] = useState(!hydratedFromInitial);
  const [issue, setIssue] = useState<IIssue | null>(() =>
    hydratedFromInitial ? initialIssue! : null
  );
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { workspaceId, projectId } = useParams();
  const detailsDrawerDisclosure = useDisclosure();
  const issueHash = issue?.[ISSUE_HASH_KEY];

  useEffect(() => {
    const fetchIssue = async () => {
      if (!identity || !workspaceId || !projectId) {
        setLoading(false);
        return;
      }
      if (
        initialIssue &&
        String(initialIssue?.[identityKey] ?? "") === String(identity)
      ) {
        setIssue(initialIssue);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const fetchFn =
          identityKey === "titleHash"
            ? getIssueByTitleHash
            : identityKey === "componentHash"
            ? getIssueByComponentHash
            : getIssue;
        const fetchedIssue = await fetchFn(workspaceId, projectId, identity);
        setIssue(fetchedIssue);
      } catch (error) {
        console.error("Error fetching issue:", error);
        message.handleError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [workspaceId, projectId, identity, identityKey, message, initialIssue]);

  useEffect(() => {
    if (issue) {
      const shortTitle =
        issue.title.length > 80
          ? issue.title.slice(0, 80) + "..."
          : issue.title;
      sendMessage({ type: "setPanelTitle", title: shortTitle });
      setSelectedEvent(null);
    }
  }, [issue]);

  const updateIssue = async (body: Partial<IIssue>) => {
    try {
      setLoading(true);
      await updateIssuesBulk(workspaceId, projectId, {
        filter: { [ISSUE_HASH_KEY]: [issueHash] },
        payload: body,
      });
      const updatedIssue = { ...issue, ...body };
      setIssue(updatedIssue);
      issuesList?.updateIssueInTheList(updatedIssue);
    } catch (error) {
      message.handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IssueContext.Provider
      value={{
        issue,
        loading,
        updateIssue,
        detailsDrawerDisclosure,
        selectedEvent,
        setSelectedEvent,
      }}
    >
      {children}
    </IssueContext.Provider>
  );
};

export const useIssue = (): IIssueContext => {
  const context = useContext(IssueContext);
  if (context === null) {
    throw new Error("useIssue must be used within IssueProvider");
  }
  return context;
};

export { IssueProvider };
