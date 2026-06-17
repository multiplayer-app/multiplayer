import { Button, Icon, Link, useDisclosure } from "@chakra-ui/react";
import { EntityDocumentIcon, ArrowRightIcon } from "shared/icons";
import CheckAccess from "shared/components/CheckAccess";
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import CreateEntityModal from "shared/components/CreateEntity/CreateEntityModal";
import { projectCategoryConfigs } from "shared/configs/project.configs";
import { EntityCategories } from "shared/models/enums";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import IntroLayout from "shared/components/IntroLayout/IntroLayout";
import { config } from "../../../config";

const NotebookIntro = () => {
  const { withSandboxCheck, isSandbox } = useProjectSandbox();
  const createEntityModal = useDisclosure();
  const configs = projectCategoryConfigs.document;

  return (
    <>
      <IntroLayout
        icon={EntityDocumentIcon}
        title="Notebooks"
        description={
          <>
            Combine executable code blocks, API calls, and data from your
            session recordings to validate flows, generate test scripts, or
            debug, test, and document API integrations.
          </>
        }
        screenshotSrc={`${process.env.PUBLIC_URL}/assets/notebook-example.svg`}
        screenshotAspectRatio="960 / 440"
      >
        <Link
          href={`${config.REACT_APP_DEMO_PUBLIC}/entity/notebook`}
          target="_blank"
          px={4}
          borderRadius={8}
          height={10}
          lineHeight="36px"
          rel="noopener noreferrer"
          color="subtle"
          border="1px solid"
          borderColor="border.secondary"
        >
          Explore the example notebooks
        </Link>
        <CheckAccess
          scope={RoleType.PROJECT}
          permission={RoleAccessAction.CREATE}
          entity={RoleProjectPermissionEntity.ENTITY}
          bypassPermissions={isSandbox}
        >
          <Button onClick={withSandboxCheck(createEntityModal.onOpen)}>
            Create your first notebook
            <Icon as={ArrowRightIcon} boxSize="16px" ml={2} />
          </Button>
        </CheckAccess>
      </IntroLayout>

      <CreateEntityModal
        type={EntityCategories.DOCUMENT}
        configs={configs.form}
        disclosure={createEntityModal}
      />
    </>
  );
};

export default NotebookIntro;
