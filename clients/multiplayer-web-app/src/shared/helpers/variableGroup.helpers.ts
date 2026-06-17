import { VariableGroup } from "@multiplayer/types";
import * as Y from "yjs";

export const convertVariableGroupToYMap = (
  group: VariableGroup,
  id?: string
): Y.Map<VariableGroup> => {
  const yGroup: Y.Map<any> = new Y.Map();
  yGroup.set("id", id || group.id);
  yGroup.set("name", group.name);

  if (group.variables) {
    const yVariables: Y.Map<Y.Map<any>> = new Y.Map();
    for (const [key, variable] of Object.entries(group.variables)) {
      const yVar: Y.Map<any> = new Y.Map();
      yVar.set("name", variable.name);
      yVar.set("description", variable.description ?? "");
      yVar.set("secret", variable.secret);
      yVar.set("value", variable.value ?? "");
      yVariables.set(key, yVar);
    }
    yGroup.set("variables", yVariables);
  }

  if (group.groups) {
    const ySubGroups: Y.Map<Y.Map<any>> = new Y.Map();
    for (const [key, subGroup] of Object.entries(group.groups)) {
      const ySubGroup: Y.Map<any> = convertVariableGroupToYMap(subGroup);
      ySubGroups.set(key, ySubGroup);
    }
    yGroup.set("groups", ySubGroups);
  }

  return yGroup;
};

export const findYGroupById = (
  groups: Y.Map<Record<string, VariableGroup>>,
  groupId: string
): Y.Map<any> | undefined => {
  for (const [groupKey, group] of groups) {
    if (groupKey === groupId) {
      return group;
    }

    const subGroups = group.get("groups") as Y.Map<any>;
    if (subGroups) {
      const foundGroup = findYGroupById(subGroups, groupId);
      if (foundGroup) {
        return foundGroup;
      }
    }
  }
  return null;
};

export const findGroupById = (
  groups: Record<string, VariableGroup>,
  groupId: string
): VariableGroup => {
  for (const [groupKey, group] of Object.entries(groups)) {
    if (groupKey === groupId) {
      return group;
    }

    const subGroups = group.groups;
    if (subGroups) {
      const foundGroup = findGroupById(subGroups, groupId);
      if (foundGroup) {
        return foundGroup;
      }
    }
  }
  return null;
};
