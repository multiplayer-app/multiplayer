import { useEffect } from "react";
import { Flex } from "@chakra-ui/react";
import DebuggerWizardHeader from "shared/components/DebuggerWizard/DebuggerWizardHeader";
import { DebuggerWizardStepsEnum, PostHogEvents } from "shared/models/enums";
import { WelcomeStep } from "./Steps";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { DebuggerWizardStepNamesMap } from "shared/configs/wizard.configs";

const DebuggerWizard = ({ onClose }) => {
  const { trackEvent } = useAnalytics();
  const activeTab = DebuggerWizardStepsEnum.WelcomeStep;

  useEffect(() => {
    trackEvent(PostHogEvents.ONBOARDING_WIZARD_STEP_VIEWED, {
      step: DebuggerWizardStepNamesMap[activeTab],
    });
  }, [activeTab]);

  return (
    <Flex
      flex="1"
      w="full"
      h="full"
      borderRadius="md"
      overflow="hidden"
      flexDirection="column"
    >
      <DebuggerWizardHeader
        onClose={onClose}
        activeTab={activeTab}
        setActiveTab={() => null}
      />
      <Flex
        py={4}
        px={16}
        flex="1"
        overflow="hidden"
        flexDirection="column"
        backgroundColor="bg.subtle"
        borderBottomRadius="16px"
      >
        <WelcomeStep onClose={onClose} />
      </Flex>
    </Flex>
  );
};

export default DebuggerWizard;
