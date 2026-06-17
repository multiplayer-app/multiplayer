import {
  EntityCommitChangeType,
  EntityType,
  Platform,
} from "@multiplayer/types";
import { PlatformComponentFields } from "shared/components/Editors/PlatformComponentEditor/editor.configs";
import { BranchChanges } from "shared/models/types";
import { getChangeType } from "../changes.helpers";
import { EnvironmentFields } from "../../components/Editors/EnvironmentEditor/editor.config";

interface EntityData {
  data: Platform;
  patch: any;
  changes: BranchChanges;
}

interface IPlatformComponentChangesPayload {
  conflicts: Set<string>;
  source: EntityData | undefined;
  target: EntityData | undefined;
}

export const getPlatformComponentChanges = (
  payload: IPlatformComponentChangesPayload,
  entityType: EntityType.PLATFORM_COMPONENT | EntityType.ENVIRONMENT
) => {
  const { source, target } = payload;

  let sourceList = [];
  let targetList = [];

  if (source) {
    sourceList = getCorrespondingChangesFromPatch(source.patch, entityType);
  }

  if (target) {
    targetList = getCorrespondingChangesFromPatch(target.patch, entityType);
  }

  const groups = new Map();

  const groupChanges = (arr) => {
    return arr.reduce((acc, item) => {
      const group =
        groups.get(item.groupId) ||
        groups.set(item.groupId, new Set()).get(item.groupId);
      group.add(item.path);

      if (!acc[item.groupId]) acc[item.groupId] = {};
      acc[item.groupId][item.path] = item;
      return acc;
    }, {});
  };

  const groupedSourceChanges = groupChanges(sourceList);
  const groupedTargetChanges = groupChanges(targetList);

  return {
    groups: Array.from(groups.keys()).map((groupId) => {
      return { groupId, paths: Array.from(groups.get(groupId)) };
    }),
    source: groupedSourceChanges,
    target: groupedTargetChanges,
  };
};

export const getModifiedPlatformComponent = (data) => {
  return (
    data || {
      information: {},
    }
  );
};

const FieldsMap = {
  [EntityType.ENVIRONMENT]: EnvironmentFields,
  [EntityType.PLATFORM_COMPONENT]: PlatformComponentFields,
};

const getCorrespondingChangesFromPatch = (
  patch: any,
  entityType: EntityType.PLATFORM_COMPONENT | EntityType.ENVIRONMENT
) => {
  if (!patch) return [];
  const { information, description } = patch;
  const changes = [];
  if (information) {
    console.log({ information, entityType });
    Object.keys(information).map((key) => {
      const config = FieldsMap[entityType][key];
      if (!config) return;
      const change = information[key];
      changes.push({
        key: key,
        patch: change,
        groupId: key,
        path: `information.${key}`,
        changeType: getChangeType(change),
        message: getMessage(change, config),
      });
    });
  }

  if (description) {
    const changeType = getChangeType(description);
    changes.push({
      changeType,
      key: "description",
      patch: description,
      path: `description`,
      groupId: "description",
      message:
        changeType === EntityCommitChangeType.UPDATE
          ? `Description was changed`
          : `Description was added`,
    });
  }
  return changes;
};

const getMessage = (change, config) => {
  const [oldVal, newVal] = change;
  if (newVal) {
    return `${config.label} was changed from <b>${
      config.valueNameMap ? config.valueNameMap[oldVal] : oldVal || '""'
    }</b> to <b>${
      config.valueNameMap ? config.valueNameMap[newVal] : newVal || '""'
    }</b>`;
  } else {
    return `${config.label} was set to <b>${
      config.valueNameMap ? config.valueNameMap[oldVal] : oldVal || '""'
    }</b>`;
  }
};

export const getPlatformComponentConflicts = (changes): Set<string> => {
  const conflicts = new Set<string>();
  changes.groups.forEach(({ groupId, paths }) => {
    paths.forEach((path) => {
      const s = changes.source[groupId] && changes.source[groupId][path];
      const t = changes.target[groupId] && changes.target[groupId][path];

      if (s && t && JSON.stringify(s.patch) !== JSON.stringify(t.patch)) {
        conflicts.add(path);
      }
    });
  });
  return conflicts;
};
