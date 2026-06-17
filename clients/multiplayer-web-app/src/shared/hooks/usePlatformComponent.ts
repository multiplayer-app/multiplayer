import { useCallback, useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import {
  EntityType,
  EnvironmentVariable,
  ITag,
  PlatformComponentInformation,
} from "@multiplayer/types";
import { EntityDiffPatch } from "@multiplayer/entity";
import { useVersion } from "shared/providers/VersionContext";
import { updateEntity } from "shared/services/version.service";
import { IPlatformComponentState } from "shared/models/interfaces";
import useMessage from "./useMessage";
import useYMapState from "shared/hooks/useYMapState";
import useCommitContent from "shared/hooks/useCommitContent";
import { EntityCategories } from "shared/models/enums";
import { getReleases } from "shared/services/version.service";
import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";

const initialState: IPlatformComponentState = {
  initialCommitContent: null,
  changedInputs: new Map(),
};

const RELEASES_LIMIT = 30;

interface UsePlatformComponentProps {
  doc: Y.Doc;
  provider: YjsSocketIOProvider;
  showChanges: boolean;
}

const usePlatformComponent = ({
  doc,
  provider,
  showChanges,
}: UsePlatformComponentProps) => {
  const message = useMessage();
  const [state, setState] = useState(initialState);
  const { currentBranchId } = useVersion();
  const { initialCommitContent } = useCommitContent({
    provider,
    showChanges,
    type: EntityType.PLATFORM_COMPONENT,
    category: EntityCategories.COMPONENT,
  });

  const [changesDiff, setChangesDiff] = useState<{
    information: any;
    variables: any;
  }>({ information: {}, variables: {} });
  const [componentInfo, onChange] = useYMapState<PlatformComponentInformation>(
    doc.getMap("information")
  );
  const [nameMap, onNameChange] = useYMapState<{ name: string }>(
    doc.getMap("name")
  );

  const [variablesInfo, onVariableChange] = useYMapState<{
    [variableName: string]: EnvironmentVariable;
  }>(doc.getMap("environmentVariables"));

  const [releases, setReleases] = useState<{ data: any[]; cursor: any }>({
    data: [],
    cursor: null,
  });
  const [releasesLoading, setReleasesLoading] = useState(false);

  const fetchReleases = useCallback(
    async (page: number = 0) => {
      try {
        setReleasesLoading(true);
        const r: any = await getReleases({
          entity: provider.entityId,
          skip: page * RELEASES_LIMIT,
          limit: RELEASES_LIMIT,
        });
        setReleases((prev) => ({
          data: page === 1 ? r.data : [...prev.data, ...r.data],
          cursor: r.cursor,
        }));
      } catch (error) {
        message.handleError(error);
      } finally {
        setReleasesLoading(false);
      }
    },
    [provider.entityId, message]
  );

  useEffect(() => {
    fetchReleases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider.entityId]);

  const onAliasChange = useCallback(
    (keyAliases: string[]) => {
      return updateEntity(currentBranchId, provider.entityId, { keyAliases });
    },
    [currentBranchId, provider.entityId]
  );

  const onTagsChange = useCallback(
    (tags: ITag[]) => {
      return updateEntity(currentBranchId, provider.entityId, { tags });
    },
    [currentBranchId, provider.entityId]
  );

  const handleChange = useCallback(
    (
      rootKey:
        | "description"
        | "information"
        | "variables"
        | "name"
        | "tags"
        | "keyAliases",
      key:
        | keyof PlatformComponentInformation
        | keyof EnvironmentVariable
        | null,
      value: any
    ) => {
      switch (rootKey) {
        case "information":
          return onChange(key as keyof PlatformComponentInformation, value);
        case "variables":
          return onVariableChange(key, value);
        case "name":
          return onNameChange(rootKey, value);
        case "keyAliases":
          return onAliasChange(value);
        case "tags":
          return onTagsChange(value);
        default:
          break;
      }
    },
    [onChange, onNameChange, onAliasChange, onTagsChange, onVariableChange]
  );

  useEffect(() => {
    if (!provider) return;
    setState((prev) => ({
      ...prev,
      initialCommitContent,
    }));
  }, [provider, initialCommitContent]);

  useEffect(() => {
    if (state.initialCommitContent) {
      const patcher = EntityDiffPatch.getDiffPatcher(
        EntityType.PLATFORM_COMPONENT
      );

      const diff: {
        information: any;
        variables: any;
      } = patcher.getDiff(
        {
          information: state.initialCommitContent.information,
          variables: state.initialCommitContent.environmentVariables,
        },
        { information: componentInfo, variables: variablesInfo }
      );

      setChangesDiff(diff);
    } else {
      setChangesDiff({ information: {}, variables: {} });
    }
  }, [state.initialCommitContent, componentInfo, variablesInfo]);

  const releasesPage = Math.ceil(releases.data.length / RELEASES_LIMIT);

  const onReleasesScrollEnd = useCallback(() => {
    const isLastPage =
      releases.cursor?.total != null &&
      releases.data.length >= releases.cursor.total;

    if (releasesLoading || isLastPage) return;
    fetchReleases(releasesPage + 1);
  }, [releasesLoading, releasesPage, releases, fetchReleases]);

  return useMemo(
    () => ({
      data: {
        information: componentInfo,
        variables: variablesInfo,
        releases,
      },
      name: nameMap.name,
      onChange: handleChange,
      changesDiff,
      releasesLoading,
      onReleasesScrollEnd,
    }),
    [
      releases,
      changesDiff,
      componentInfo,
      variablesInfo,
      handleChange,
      nameMap,
      releasesLoading,
      onReleasesScrollEnd,
    ]
  );
};

export default usePlatformComponent;
