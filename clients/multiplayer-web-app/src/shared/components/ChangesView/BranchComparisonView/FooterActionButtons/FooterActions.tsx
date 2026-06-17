import { Button, Flex, Icon, Text } from "@chakra-ui/react";
import { Resolution } from "@multiplayer/types";
import { DownloadIcon, MergeIcon, ReloadIcon } from "shared/icons";
import { useState } from "react";
import { getCombinedPatch } from "shared/helpers/changes.helpers";
import useMessage from "shared/hooks/useMessage";
import { Endpoint, StageStatus } from "shared/models/enums";
import {
  IBranchMergePayload,
  IBranchUpdatePayload,
} from "shared/models/interfaces";
import { useChangesContext } from "shared/providers/ChangesContext";

const FooterActions = ({ onMergeDone }) => {
  const message = useMessage();
  const {
    isReloadRequired,
    entityIds,
    conflicts,
    isLoading,
    isResolved,
    sourceBranch,
    targetBranch,
    staged,
    states,
    pushChanges,
    pullChanges,
    reloadChanges,
  } = useChangesContext();
  const [loading, setLoading] = useState<boolean>(false);

  const getResolutions = (): Record<string, Resolution> => {
    const resolutions: Record<string, Resolution> = {};

    Object.keys(staged).forEach((key) => {
      const stage = staged[key];
      const state = states.get(key);
      const isConflict = conflicts.has(key);
      const stagedEndpoint =
        stage.source.status === StageStatus.STAGED &&
        stage.target.status === StageStatus.UNSTAGED
          ? Endpoint.SOURCE
          : stage.target.status === StageStatus.STAGED &&
            stage.source.status === StageStatus.UNSTAGED
          ? Endpoint.TARGET
          : null;

      // If it's non conflicted change or one of endpoints is staged we need to take entityCommitId
      // otherwise combined patch
      if (!isConflict || stagedEndpoint) {
        resolutions[key] = {
          entityCommitId: state[stagedEndpoint].entityCommitId,
        };
      } else {
        resolutions[key] = { patch: getCombinedPatch(state, stage) };
      }
    });

    return resolutions;
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const payload: IBranchUpdatePayload = {
        baseBranch: targetBranch._id,
        branchToUpdate: sourceBranch._id,
      };
      if (conflicts.size) {
        payload.resolutions = getResolutions();
      }
      await pullChanges(payload);
    } catch (error) {
      message.handleError(error);
    }
    setLoading(null);
  };

  const handleMerge = async () => {
    try {
      setLoading(true);
      const payload: IBranchMergePayload = {
        projectBranchFrom: sourceBranch._id,
        projectBranchTo: targetBranch._id,
      };
      await pushChanges(payload);
      onMergeDone(payload);
    } catch (error) {
      message.handleError(error);
    }
    setLoading(null);
  };

  if (!entityIds.length) return null;

  if (isReloadRequired) {
    return (
      <Flex gap="8" alignItems="center">
        <Text>Press reload to apply the newest changes.</Text>
        <Button
          isLoading={isLoading}
          leftIcon={<Icon as={ReloadIcon} />}
          onClick={reloadChanges}
        >
          Reload
        </Button>
      </Flex>
    );
  }

  if (conflicts.size) {
    return (
      <Button
        isLoading={loading}
        isDisabled={!isResolved || !!loading}
        leftIcon={<Icon as={DownloadIcon} />}
        onClick={handleUpdate}
      >
        Update
      </Button>
    );
  } else {
    return (
      <Button
        isLoading={loading}
        isDisabled={!isResolved || !!loading}
        leftIcon={<Icon as={MergeIcon} />}
        onClick={handleMerge}
      >
        Merge
      </Button>
    );
  }
};

export default FooterActions;
