import { Box, Checkbox } from "@chakra-ui/react";
import { EntityCommitChangeType } from "@multiplayer/types";
import { memo } from "react";
import { getOppositeEndpoint } from "shared/helpers/changes.helpers";
import {
  Endpoint,
  StageStatus,
  PlatformChangeObject,
} from "shared/models/enums";
import { StagedChange } from "shared/models/types";
import { useChangesContext } from "shared/providers/ChangesContext";
import { getNestedProperty, setNestedProperty } from "shared/utils";

const StageCheckbox = ({
  path,
  groupId,
  entityId,
  endpoint,
}: StageCheckboxProps) => {
  const { staged, states, conflicts, stageEntityChange } = useChangesContext();
  const isEntityConflict = conflicts.has(entityId);

  if (!isEntityConflict) return null;

  const chunkStatus = getNestedProperty<StageStatus>(staged, [
    entityId,
    endpoint,
    "chunks",
    path,
    "status",
  ]);

  const isChecked = chunkStatus === StageStatus.STAGED;

  const onChunkToggle = (checked) => {
    const oppEndpoint = getOppositeEndpoint(endpoint);
    const { changesForPreview, conflicts } = states.get(entityId);
    const isConflict = conflicts.has(path);
    const item = getNestedProperty<any>(changesForPreview, [
      endpoint,
      groupId,
      path,
    ]);

    const isComponent = item.objectType === PlatformChangeObject.COMPONENT;
    const isEdge = item.objectType === PlatformChangeObject.EDGE;

    const groups = getNestedProperty(changesForPreview, [endpoint]);
    const oppositeGroups = getNestedProperty(changesForPreview, [oppEndpoint]);

    const siblings = getNestedProperty<any>(groups, [groupId], {});
    const oppositeGroup = getNestedProperty<any>(oppositeGroups, [groupId], {});

    stageEntityChange(entityId, (state: StagedChange) => {
      const status = checked ? StageStatus.STAGED : StageStatus.UNSTAGED;

      state[endpoint].chunks[path] = { status };

      if (isConflict) {
        setNestedProperty(
          state,
          [oppEndpoint, "chunks", path, "status"],
          StageStatus.UNSTAGED
        );
      }
      // If component was removed
      if (isComponent) {
        if (item.changeType === EntityCommitChangeType.DELETE) {
          Object.values(siblings).forEach(
            ({ path: chunkPath, isSideEffect }) => {
              if (isSideEffect) {
                setNestedProperty(
                  state,
                  [endpoint, "chunks", chunkPath, "status"],
                  status
                );
              }
            }
          );

          Object.values(oppositeGroup).forEach(
            ({ path: chunkPath, changeType, parentPaths }) => {
              if (parentPaths?.includes(path)) {
                setNestedProperty(
                  state,
                  [oppEndpoint, "chunks", chunkPath, "status"],
                  changeType === EntityCommitChangeType.DELETE
                    ? status
                    : StageStatus.UNSTAGED
                );
              }
            }
          );
        } else if (item.changeType === EntityCommitChangeType.CREATE) {
          if (!checked) {
            Object.values(siblings).forEach(({ path: chunkPath }) => {
              setNestedProperty(
                state,
                [endpoint, "chunks", chunkPath, "status"],
                StageStatus.UNSTAGED
              );
            });
          }
        }
      } else if (isEdge) {
        const [sourceParentPath, targetParentPath] = item.parentPaths;
        const targetGroupId = targetParentPath.split(".")[1];
        const parent = siblings[sourceParentPath];
        const targetParent = getNestedProperty<any>(
          groups,
          [targetGroupId, targetParentPath],
          {}
        );
        const oppParent = oppositeGroup[sourceParentPath];
        const oppTargetParent = getNestedProperty<any>(
          oppositeGroups,
          [targetGroupId, targetParentPath],
          {}
        );

        if (item.changeType === EntityCommitChangeType.CREATE) {
          if (checked) {
            if (parent.changeType === EntityCommitChangeType.CREATE) {
              setNestedProperty(
                state,
                [endpoint, "chunks", sourceParentPath, "status"],
                StageStatus.STAGED
              );
            }
            if (oppParent?.changeType === EntityCommitChangeType.DELETE) {
              setNestedProperty(
                state,
                [oppEndpoint, "chunks", sourceParentPath, "status"],
                StageStatus.UNSTAGED
              );
            }
          }
        }
        // If we are going to uncheck dependency removal wee need to discard removal change for source and target components
        else if (item.changeType === EntityCommitChangeType.DELETE) {
          if (!checked) {
            if (parent.changeType === EntityCommitChangeType.DELETE) {
              setNestedProperty(
                state,
                [endpoint, "chunks", sourceParentPath, "status"],
                StageStatus.UNSTAGED
              );
            }
            if (targetParent.changeType === EntityCommitChangeType.DELETE) {
              setNestedProperty(
                state,
                [endpoint, "chunks", targetParentPath, "status"],
                StageStatus.UNSTAGED
              );
            }

            if (oppParent?.changeType === EntityCommitChangeType.DELETE) {
              setNestedProperty(
                state,
                [oppEndpoint, "chunks", sourceParentPath, "status"],
                StageStatus.UNSTAGED
              );
            }

            if (oppTargetParent.changeType === EntityCommitChangeType.DELETE) {
              setNestedProperty(
                state,
                [oppEndpoint, "chunks", targetParentPath, "status"],
                StageStatus.UNSTAGED
              );
            }
          }
        }
      }
      return state;
    });
  };

  return (
    <Box w="4">
      <Checkbox
        bg="bg.primary"
        display="flex"
        isChecked={isChecked}
        onChange={(e) => onChunkToggle(e.target.checked)}
      />
    </Box>
  );
};

interface StageCheckboxProps {
  path: string;
  groupId: string;
  entityId: string;
  endpoint: Endpoint;
}

export default memo(StageCheckbox);
