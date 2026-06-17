import { Flex, Text } from "@chakra-ui/react";
import { AgentsSparkleIntroIcon } from "shared/icons";
import CliInstallCommandBox from "shared/components/CliInstallCommandBox/CliInstallCommandBox";
import ApiKeysSettingsLink from "shared/components/ApiKeysSettingsLink";
import IntroLayout from "shared/components/IntroLayout/IntroLayout";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";

const AgentsIntro = () => {
  const { isSandbox } = useProjectSandbox();
  const { isPublic } = useWorkspace();

  return (
    <IntroLayout
      icon={AgentsSparkleIntroIcon}
      title="The debugging agent for developers"
      description={
        <>
          Fix bugs automatically from production using your coding agent on your
          laptop.
        </>
      }
      screenshotSrc={`${process.env.PUBLIC_URL}/assets/agents-intro-screenshot.png`}
      screenshotMaxW="980px"
      screenshotAspectRatio="3248 / 1986"
    >
      <Flex
        direction="column"
        align="center"
        gap={6}
        w="full"
        maxW="620px"
        mt={2}
      >
        <Text fontSize="sm" color="body" textAlign="center">
          One copy/paste in your terminal, and you&apos;re done.
        </Text>
        <CliInstallCommandBox />
        <Flex
          gap={4}
          alignItems="center"
          justifyContent="center"
          flexWrap="wrap"
        >
          {!isPublic && (
            <ApiKeysSettingsLink bypassPermissions={isSandbox}>
              Create an API key
            </ApiKeysSettingsLink>
          )}
        </Flex>
      </Flex>
    </IntroLayout>
  );
};

export default AgentsIntro;
