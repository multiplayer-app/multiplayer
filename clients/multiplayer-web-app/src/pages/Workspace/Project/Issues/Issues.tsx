import { memo } from "react";
import { useParams } from "react-router-dom";

import PageLoading from "shared/components/PageLoading";
import { IssuesProvider, useIssues } from "shared/providers/IssuesContext";
import { useOtelIntegrations } from "shared/providers/IntegrationsContext";

import IssueList from "./IssueList";
import IssueIntro from "./IssueIntro";
import IssuePreview from "./IssuePreview";

const Issues = () => {
  return (
    <IssuesProvider>
      <IssueRootContent />
    </IssuesProvider>
  );
};

const IssueRootContent = memo(() => {
  const { integrations, isIntegrationsLoaded } = useOtelIntegrations();
  const { issues, hasFilters, loading } = useIssues();

  return !isIntegrationsLoaded ? (
    <PageLoading />
  ) : issues.cursor.total > 0 || hasFilters || integrations ? (
    <IssueContent />
  ) : loading ? (
    <PageLoading />
  ) : (
    <IssueIntro />
  );
});

const IssueContent = memo(() => {
  const { path: titleHash } = useParams();

  if (titleHash) {
    return <IssuePreview />;
  }
  return <IssueList />;
});

export default Issues;
