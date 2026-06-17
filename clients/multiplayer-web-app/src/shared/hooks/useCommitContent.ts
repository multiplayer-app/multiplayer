import { getEntityCommitContentsMemo } from "shared/services/version.service";
import { getConvertedData } from "shared/helpers/diff-parsers";
import { EntityCommitChangeType, EntityType } from "@multiplayer/types";
import { useEntities } from "shared/providers/EntitiesContext";
import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";
import { useEffect, useMemo, useState } from "react";
import { useVersion } from "shared/providers/VersionContext";
import { EntityCategories } from "shared/models/enums";

const useCommitContent = ({
  provider,
  showChanges,
  type,
  category,
}: {
  provider: YjsSocketIOProvider;
  showChanges: boolean;
  type: EntityType;
  category: EntityCategories;
}) => {
  const { entityCommits, entities } = useEntities();
  const { currentBranchId, currentBranch } = useVersion();
  const [initialCommitContent, setInitialCommitContent] = useState<any>(null);

  const entity = useMemo(() => {
    return entities[category].find((e) => e.entityId === provider.entityId);
  }, [entities, provider.entityId]);

  useEffect(() => {
    const fetchContent = async () => {
      const commit = entityCommits[provider.entityId];
      if (!commit) return;

      const content = await getEntityCommitContentsMemo(
        provider.branchId,
        provider.entityId,
        commit.baseEntityCommit
      );

      const converted = getConvertedData(type, content);
      setInitialCommitContent(converted);
    };

    const isDefaultBranch = currentBranch?.data?.default;
    const isNewEntity =
      entity?.typeOfChangeInBranch === EntityCommitChangeType.CREATE &&
      entity.projectBranch === currentBranchId;

    if (showChanges && !isDefaultBranch && !isNewEntity) {
      fetchContent();
    } else {
      setInitialCommitContent(null);
    }
  }, [
    provider,
    entity,
    entityCommits,
    currentBranch,
    currentBranchId,
    showChanges,
  ]);

  return useMemo(
    () => ({
      initialCommitContent,
    }),
    [initialCommitContent]
  );
};

export default useCommitContent;
