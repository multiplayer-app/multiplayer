import { Flex, Icon } from "@chakra-ui/react";
import type { IIssue } from "@multiplayer/types";
import { memo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import useMessage from "shared/hooks/useMessage";
import PageLoading from "shared/components/PageLoading";
import { IssueProvider } from "shared/providers/IssueContext";
import { getIssueByComponentHash } from "shared/services/radar.service";
import {
  IssuePageBody,
  IssueEmbeddedProvider,
} from "pages/Workspace/Project/Issues/IssuePreview";
import EmptyScreen from "shared/components/EmptyScreen";
import { IssuesIcon } from "shared/icons";

type IssueTabProps = {
  componentHash: string | null;
};

function issuePrimaryId(issue: IIssue): string | null {
  const id = issue._id ?? (issue as { id?: string }).id;
  return id != null && String(id) !== "" ? String(id) : null;
}

const IssueTab = memo(function IssueTab({ componentHash }: IssueTabProps) {
  const { workspaceId, projectId } = useParams();
  const message = useMessage();
  const [issue, setIssue] = useState<IIssue | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!componentHash || !workspaceId || !projectId) {
      setIssue(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setIssue(null);

    getIssueByComponentHash(workspaceId, projectId, componentHash)
      .then((data) => {
        if (!cancelled) setIssue(data);
      })
      .catch(() => {
        if (!cancelled) {
          setIssue(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [componentHash, workspaceId, projectId, message]);

  if (!componentHash) {
    return (
      <EmptyScreen
        title="Issue not found"
        icon={<Icon as={IssuesIcon} />}
        description="No issue is linked to this session."
      />
    );
  }

  if (loading) {
    return <PageLoading />;
  }

  const issueId = issue ? issuePrimaryId(issue) : null;

  if (!issue || !issueId) {
    return (
      <EmptyScreen
        title="Issue not found"
        icon={<Icon as={IssuesIcon} />}
        description="Issue could not be loaded."
      />
    );
  }

  return (
    <IssueProvider identity={issueId} identityKey="_id" initialIssue={issue}>
      <IssueEmbeddedProvider>
        <Flex
          flex="1"
          minH="0"
          minW="0"
          direction="column"
          overflow="hidden"
          h="full"
        >
          <IssuePageBody />
        </Flex>
      </IssueEmbeddedProvider>
    </IssueProvider>
  );
});

export default IssueTab;
