import { EntityDiffPatch } from "@multiplayer/entity";
import {
  Platform,
  EntityType,
  VisualizationType,
  EntityCommitChangeType,
} from "@multiplayer/types";
import { getChangeType } from "shared/helpers/changes.helpers";
import { IDataDiff } from "../types";
import { getNestedProperty } from "shared/utils";
import { SystemViewTypes } from "shared/models/enums";

export const getPlatformDiff = (
  baseContent: Platform,
  currentContent: Platform
): IDataDiff => {
  const nodes = new Map();
  const edges = new Map();
  const groups = new Map();

  const patcher = EntityDiffPatch.getDiffPatcher(EntityType.PLATFORM);
  let diffs: { views?: any; components?: any; edges?: any; groups?: any } =
    null;

  if (!baseContent) return { nodes, edges, groups };
  diffs = patcher.getDiff(baseContent, currentContent);

  if (diffs) {
    diffs.groups &&
      Object.keys(diffs.groups).forEach((groupId) => {
        const diff = diffs.groups[groupId];
        const type = getChangeType(diff);
        if (type !== EntityCommitChangeType.DELETE) {
          nodes.set(groupId, { type });
        } else {
          const statePath = [SystemViewTypes.ALL, "groups", groupId];
          const state = getNestedProperty(diffs.views, statePath, []);
          groups.set(groupId, {
            type,
            data: { group: diff[0], state: state[0] },
          });
        }
      });

    diffs.components &&
      Object.keys(diffs.components).forEach((nodeId) => {
        const diff = diffs.components[nodeId];
        const type = getChangeType(diff);
        if (type !== EntityCommitChangeType.DELETE) {
          nodes.set(nodeId, { type });
          const component = currentContent.components[nodeId];
          if (component.groupId && !groups.get(component.groupId)) {
            groups.set(component.groupId, {
              type: EntityCommitChangeType.UPDATE,
            });
          }
        } else {
          const statePath = [
            SystemViewTypes.ALL,
            "visualizations",
            VisualizationType.DIAGRAM,
            nodeId,
          ];
          const state = getNestedProperty(diffs.views, statePath, []);
          const component = diff[0];
          nodes.set(nodeId, {
            type,
            data: { component, state: state[0] },
          });

          if (component.groupId && !groups.get(component.groupId)) {
            groups.set(component.groupId, {
              type: EntityCommitChangeType.UPDATE,
            });
          }
        }
      });

    diffs.edges &&
      Object.keys(diffs.edges).forEach((edgeId) => {
        const type = getChangeType(diffs.edges[edgeId]);
        edges.set(edgeId, { type, data: diffs.edges[edgeId] });
        const nodeIds = edgeId.split("_");
        nodeIds.forEach((nodeId) => {
          if (!nodes.get(nodeId)) {
            nodes.set(nodeId, { type: EntityCommitChangeType.UPDATE });
            const component = currentContent.components[nodeId];
            if (component.groupId && !groups.get(component.groupId)) {
              groups.set(component.groupId, {
                type: EntityCommitChangeType.UPDATE,
              });
            }
          }
        });
      });
  }
  return { nodes, edges, groups };
};
