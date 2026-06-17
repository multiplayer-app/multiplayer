import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { EntityType, Variable, VariableGroup } from "@multiplayer/types";
import { EntityDiffPatch } from "@multiplayer/entity";

import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";
import { useEntities } from "shared/providers/EntitiesContext";
import { EntityCategories } from "shared/models/enums";
import { IVariablesGroupState } from "shared/models/interfaces";
import { convertDocToData } from "shared/hooks/useYDoc";
import {
  convertVariableGroupToYMap,
  findGroupById,
  findYGroupById,
} from "shared/helpers/variableGroup.helpers";
import useCommitContent from "shared/hooks/useCommitContent";
import { useParams } from "react-router-dom";

const initialState: IVariablesGroupState = {
  initialCommitContent: null,
  changedInputs: new Map(),
};

interface UseVariablesGroupProps {
  doc: Y.Doc;
  provider: YjsSocketIOProvider;
  showChanges: boolean;
}

const TOP_LEVEL_GROUP_ID = "main";

const isTopLevelGroup = (group: VariableGroup): boolean =>
  !group || group.id === TOP_LEVEL_GROUP_ID;

const useVariablesGroup = ({
  doc,
  provider,
  showChanges,
}: UseVariablesGroupProps) => {
  const [data, setData] = useState<VariableGroup>(null);
  const [selectedGroup, setSelectedGroup] = useState<VariableGroup>(null);
  const [isRootSelected, setIsRootSelected] = useState(true);
  const { onEntityDelete } = useEntities();
  const { path: entityId } = useParams();
  const { initialCommitContent } = useCommitContent({
    provider,
    showChanges,
    type: EntityType.VARIABLE_GROUP,
    category: EntityCategories.VARIABLE_GROUP,
  });
  const [state, setState] = useState(initialState);
  const [changesDiff, setChangesDiff] = useState<{
    variables: any;
  }>({ variables: {} });

  const selectedGroupRef = useRef<VariableGroup>(null);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
    setIsRootSelected(isTopLevelGroup(selectedGroupRef.current));
  }, [selectedGroup]);

  const getRootGroups = useCallback((): Y.Map<any> => {
    const objectMap: Y.Map<any> = doc.getMap("object");
    let groups: Y.Map<any> = objectMap.get("groups");
    if (!groups) {
      groups = new Y.Map();
      objectMap.set("groups", groups);
    }
    return groups;
  }, [doc]);

  const handleUpdate = useCallback(() => {
    const currentSelectedGroup = selectedGroupRef.current;
    const convertedData = convertDocToData(EntityType.VARIABLE_GROUP, doc);
    convertedData.name = doc.getMap("name").toJSON()?.name;
    setData(convertedData);
    if (isTopLevelGroup(selectedGroupRef.current)) {
      setSelectedGroup(convertedData);
    } else {
      const groups = getRootGroups();
      const currentSelection = findYGroupById(groups, currentSelectedGroup.id);
      if (currentSelection) {
        const selection = currentSelection.toJSON() as VariableGroup;
        setSelectedGroup(selection);
      } else {
        setSelectedGroup(convertedData);
      }
    }
  }, [doc, getRootGroups]);

  useEffect(() => {
    if (!doc) return;

    handleUpdate();

    doc.on("update", handleUpdate);

    return () => {
      doc.off("update", handleUpdate);
    };
  }, [doc]);

  useEffect(() => {
    if (!provider) return;
    if (isRootSelected || !initialCommitContent) {
      setState((prev) => ({
        ...prev,
        initialCommitContent,
      }));
    } else {
      const group = findGroupById(
        initialCommitContent.groups,
        selectedGroup.id
      );
      setState((prev) => ({
        ...prev,
        initialCommitContent: group,
      }));
    }
  }, [provider, initialCommitContent, isRootSelected, selectedGroup]);

  useEffect(() => {
    if (state.initialCommitContent) {
      const patcher = EntityDiffPatch.getDiffPatcher(EntityType.VARIABLE_GROUP);

      const diff: {
        variables: any;
      } = patcher.getDiff(
        {
          variables: state.initialCommitContent.variables,
        },
        { variables: variables.toJSON() }
      );

      setChangesDiff(diff);
    } else {
      setChangesDiff({ variables: {} });
    }
  }, [state.initialCommitContent, selectedGroup?.variables]);

  const deleteGroup = useCallback(
    (key: string, parentId: string) => {
      const objectMap: Y.Map<any> = doc.getMap("object");
      const groups = getRootGroups();
      if (!parentId) {
        objectMap.clear();
        onEntityDelete(entityId, EntityType.VARIABLE_GROUP);
      } else {
        const parentGroup =
          parentId === TOP_LEVEL_GROUP_ID
            ? objectMap
            : findYGroupById(groups, parentId);
        if (parentGroup) {
          parentGroup.get("groups")?.delete(key);
        }
      }
    },
    [doc]
  );

  const setGroup = useCallback(
    (key: string, newGroup: VariableGroup, parentId?: string) => {
      if (!doc) return;

      doc.transact(() => {
        if (!newGroup) {
          deleteGroup(key, parentId);
          return;
        }

        const groups = getRootGroups();
        const yGroup = convertVariableGroupToYMap(newGroup, key);

        if (parentId !== TOP_LEVEL_GROUP_ID) {
          // Attempt to find and update in nested groups
          const parentGroup = findYGroupById(groups, parentId);
          if (!parentGroup) {
            groups.set(key, yGroup);
          } else {
            let nestedGroups = parentGroup.get("groups") as Y.Map<any>;
            if (!nestedGroups) {
              nestedGroups = new Y.Map();
              parentGroup.set("groups", nestedGroups);
            }
            nestedGroups.set(key, yGroup);
          }
        } else {
          // If no parentId, just update the top level directly
          groups.set(key, yGroup);
        }
      });
    },
    [doc]
  );

  const onOpenVariablesGroup = useCallback(
    (group: VariableGroup) => {
      setSelectedGroup(group);
    },
    [setSelectedGroup]
  );

  useEffect(() => {
    if (!doc) return;

    let objectMap: Y.Map<any> = doc.getMap("object");

    if (!isRootSelected) {
      const groups: Y.Map<any> = objectMap.get("groups");
      objectMap = findYGroupById(groups, selectedGroup?.id);
      if (!objectMap) return;
    }

    if (!objectMap.get("variables")) {
      objectMap.set("variables", new Y.Map());
    }
  }, [doc, isRootSelected, selectedGroup]);

  const variables = useMemo(() => {
    if (!doc) return null;

    let objectMap: Y.Map<any> = doc.getMap("object");

    if (!isRootSelected) {
      const groups: Y.Map<any> = objectMap.get("groups");
      objectMap = findYGroupById(groups, selectedGroup?.id);
      if (!objectMap) return null;
    }

    return objectMap.get("variables") || null;
  }, [doc, isRootSelected, selectedGroup]);

  const onVariableChange = useCallback(
    (id: string, variable: Variable) => {
      if (!doc) {
        return;
      }

      doc.transact(() => {
        if (variable) {
          variables.set(id, variable);
        } else {
          variables.delete(id);
        }
      });
    },
    [doc, variables]
  );

  const onNameUpdate = useCallback(
    (id: string, name: string) => {
      if (!doc) return;

      doc.transact(() => {
        if (id === TOP_LEVEL_GROUP_ID) {
          doc.getMap("name").set("name", name);
        } else {
          const groups = getRootGroups();
          const parent = findYGroupById(groups, id);
          if (parent) {
            parent.set("name", name);
          }
        }
      });
    },
    [doc, getRootGroups]
  );

  return useMemo(
    () => ({
      yVariables: variables,
      groups: data,
      changesDiff,
      selectedGroup,
      onVariableChange,
      setGroup,
      onOpenVariablesGroup,
      onNameUpdate,
    }),
    [
      data,
      changesDiff,
      selectedGroup,
      onVariableChange,
      onOpenVariablesGroup,
      onNameUpdate,
      setGroup,
    ]
  );
};

export default useVariablesGroup;
