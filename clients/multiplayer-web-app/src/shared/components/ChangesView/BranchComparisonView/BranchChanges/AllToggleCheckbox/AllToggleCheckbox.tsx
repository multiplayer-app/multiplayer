import { Checkbox } from "@chakra-ui/react";
import { useMemo } from "react";
import { Endpoint, StageStatus } from "shared/models/enums";
import { useChangesContext } from "shared/providers/ChangesContext";

interface AllToggleCheckboxProps {
  endpoint: Endpoint;
}

const AllToggleCheckbox = ({ endpoint }: AllToggleCheckboxProps) => {
  const { staged, isLoading, stageAllChanges, conflicts } = useChangesContext();
  const toggleAll = ({ target: { checked } }) => {
    stageAllChanges(endpoint, checked);
  };

  const allState = useMemo<StageStatus>(() => {
    const stageIds = Object.keys(staged);

    if (!stageIds.length) return StageStatus.UNSTAGED;

    const stagesArr = stageIds.reduce((acc, key) => {
      if (conflicts.has(key)) acc.push(staged[key]);
      return acc;
    }, []);

    const isAllChecked = stagesArr.every(
      (st) => st[endpoint].status === StageStatus.STAGED
    );

    const isIndeterminate =
      !isAllChecked &&
      stagesArr.some(
        (st) =>
          st[endpoint].status === StageStatus.STAGED ||
          st[endpoint].status === StageStatus.INDETERMINATE
      );

    return isAllChecked
      ? StageStatus.STAGED
      : isIndeterminate
      ? StageStatus.INDETERMINATE
      : StageStatus.UNSTAGED;
  }, [staged, conflicts]);

  if (!conflicts.size || isLoading) return null;

  return (
    <Checkbox
      gap="2"
      onChange={toggleAll}
      isChecked={allState === StageStatus.STAGED}
      isIndeterminate={allState === StageStatus.INDETERMINATE}
    >
      Select all changes
    </Checkbox>
  );
};

export default AllToggleCheckbox;
