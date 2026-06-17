import { Button, useDisclosure } from "@chakra-ui/react";
import CreateEntityModal from "./CreateEntityModal";
import ImportEntitiesModal from "./ImportEntityModal";
import { useVersion } from "shared/providers/VersionContext";
import { projectCategoryConfigs } from "shared/configs/project.configs";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { EntityCategories } from "shared/models/enums";

const CreateEntity = ({
  type,
  onCreateComplete,
}: {
  type: EntityCategories;
  onCreateComplete?: (entityId: string, entityType: string) => void;
}) => {
  const createEntityModal = useDisclosure();
  const importDisclosure = useDisclosure();
  const { isCurrentBranchLocked } = useVersion();
  const { withSandboxCheck } = useProjectSandbox();
  const configs = projectCategoryConfigs[type];

  if (!configs.form || isCurrentBranchLocked) return null;

  const importConfigs = configs.import;

  return (
    <>
      <CreateEntityModal
        type={type}
        configs={configs.form}
        disclosure={createEntityModal}
        onCreateComplete={onCreateComplete}
      />
      {importConfigs ? (
        <>
          <ImportEntitiesModal
            configs={configs}
            isOpen={importDisclosure.isOpen}
            onClose={importDisclosure.onClose}
          />
          <Button
            variant="light"
            onClick={withSandboxCheck(importDisclosure.onOpen)}
          >
            {importConfigs.button}
          </Button>
        </>
      ) : null}
      <Button onClick={withSandboxCheck(createEntityModal.onOpen)}>
        {configs.button}
      </Button>
    </>
  );
};

export default CreateEntity;
