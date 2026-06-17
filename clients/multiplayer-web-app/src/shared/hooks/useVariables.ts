import { EntityCommitChangeType } from "@multiplayer/types";
import { useCallback, useMemo, useState } from "react";
import { getNestedProperty } from "shared/utils";
import { getChangeType } from "shared/helpers/changes.helpers";

interface UseVariablesProps {
  changesDiff: any;
}

const useVariables = ({ changesDiff }: UseVariablesProps) => {
  const [disabledRows, setDisabledRows] = useState({});
  const getChangedFieldStyles = (changeType: EntityCommitChangeType) => {
    const styles = {
      [EntityCommitChangeType.DELETE]: {
        backgroundColor: "red.50",
        borderRadius: "0",
      },
      [EntityCommitChangeType.CREATE]: {
        backgroundColor: "green.50",
        borderRadius: "0",
      },
    };
    return styles[changeType] || {};
  };

  const getPreviousFieldValue = useCallback(
    (variableId: string, fieldId: string, isEnvironment: boolean = false) => {
      const path = isEnvironment ? ["environments", fieldId] : [fieldId];
      const diff = getNestedProperty(changesDiff, [variableId, ...path], "");

      return diff?.length ? diff[0] : "";
    },
    [changesDiff]
  );

  const getDeletedVariables = () => {
    const disabledRowsObject = {};
    const deletedVariables =
      changesDiff &&
      Object.values(changesDiff)
        .filter((changedVar) => {
          return getChangeType(changedVar) === EntityCommitChangeType.DELETE;
        })
        .map((changeArray) => {
          disabledRowsObject[changeArray[0].id] = true;
          return {
            ...changeArray[0],
            _id: changeArray[0].id,
            changeType: EntityCommitChangeType.DELETE,
          };
        });
    setDisabledRows(disabledRowsObject);
    return deletedVariables;
  };

  const isNameDuplicate = (id: string, name: string, data: any[]) => {
    return data.some((item) => item.name === name && item.id !== id);
  };

  return useMemo(
    () => ({
      disabledRows,
      getChangedFieldStyles,
      getPreviousFieldValue,
      getDeletedVariables,
      isNameDuplicate,
    }),
    [
      disabledRows,
      getChangedFieldStyles,
      getPreviousFieldValue,
      getDeletedVariables,
      isNameDuplicate,
    ]
  );
};

export default useVariables;
