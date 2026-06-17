import { Flex } from "@chakra-ui/react";
import BranchComparisonView from "./BranchComparisonView";
import EntityComparisonView from "./EntityComparisonView";
import { useChangesContext } from "shared/providers/ChangesContext";
import EntityPreview from "./EntityPreview";

const ChangesView = ({ onMergeDone }) => {
  const { selected, sourceChanges, targetChanges, sourceBranch, targetBranch } =
    useChangesContext();

  return (
    <Flex
      h="full"
      direction="column"
      overflow="hidden"
      position="relative"
      borderRadius="inherit"
    >
      <BranchComparisonView isActive={!selected} onMergeDone={onMergeDone} />
      <EntityComparisonView
        entityId={selected}
        isActive={!!selected}
        sourceBranch={sourceBranch}
        targetBranch={targetBranch}
        sourceChange={sourceChanges.get(selected)}
        targetChange={targetChanges.get(selected)}
      />
      <EntityPreview />
    </Flex>
  );
};

export default ChangesView;
