import { Checkbox } from "@chakra-ui/react";
import { getOppositeEndpoint } from "shared/helpers/changes.helpers";
import { Endpoint, StageStatus } from "shared/models/enums";
import { useChangesContext } from "shared/providers/ChangesContext";

interface ChangeItemCheckboxProps {
  id: string;
  endpoint: Endpoint;
}

const ChangeItemCheckbox = ({ id, endpoint }: ChangeItemCheckboxProps) => {
  const { staged, states, conflicts, stageEntityChange } = useChangesContext();
  const isConflict = conflicts.has(id); // Entity changed on both branches
  if (!isConflict) return null;

  const state = states.get(id);
  const stage = staged[id];
  let isChecked = false;
  let isIndeterminate = false;

  if (stage && stage[endpoint]) {
    isChecked = stage[endpoint].status === StageStatus.STAGED;
    isIndeterminate = stage[endpoint].status === StageStatus.INDETERMINATE;
  }

  const handleChangeStage = ({ target: { checked } }) => {
    stageEntityChange(id, (prev) => {
      const status = checked ? StageStatus.STAGED : StageStatus.UNSTAGED;
      prev[endpoint].status = status;
      prev[endpoint].chunks &&
        Object.keys(prev[endpoint].chunks).forEach((key) => {
          prev[endpoint].chunks[key] = { status: prev[endpoint].status };
        });
      const oppEndpoint = getOppositeEndpoint(endpoint);

      if (checked && state.hasConflicts) {
        prev[oppEndpoint].status = StageStatus.UNSTAGED;
        prev[oppEndpoint].chunks &&
          Object.keys(prev[oppEndpoint].chunks).forEach((key) => {
            prev[oppEndpoint].chunks[key] = { status: StageStatus.UNSTAGED };
          });
      }
      return prev;
    });
  };

  return (
    <Checkbox
      display="flex"
      isChecked={isChecked}
      isIndeterminate={isIndeterminate}
      onChange={handleChangeStage}
    />
  );
};

export default ChangeItemCheckbox;
