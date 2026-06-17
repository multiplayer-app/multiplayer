import { DebuggerWizardStepsEnum, PostHogEvents } from "shared/models/enums";
import { Box, Button, Flex } from "@chakra-ui/react";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { DebuggerWizardStepNamesMap } from "shared/configs/wizard.configs";

const DebuggerWizardPagination = ({ activeTab, setActiveTab }) => {
  const isFirstStep = activeTab === DebuggerWizardStepsEnum.ClientSetupStep;
  const { trackEvent } = useAnalytics();
  return (
    <Box
      position="sticky"
      width="100%"
      backgroundColor="bg.primary"
      bottom={8}
      mb={8}
    >
      <Box
        position="absolute"
        top="-32px"
        left="0"
        right="0"
        height={8}
        bgGradient="linear(to-t, var(--chakra-colors-bg-primary), transparent)"
      />
      <Box
        position="absolute"
        bottom={-8}
        left="0"
        width="full"
        height={8}
        backgroundColor="bg.primary"
      />
      <Flex alignItems="center" justifyContent="space-between">
        <Button
          variant="outline"
          cursor={isFirstStep ? "default" : "pointer"}
          opacity={isFirstStep ? 0.2 : 1}
          disabled={activeTab === DebuggerWizardStepsEnum.ClientSetupStep}
          onClick={() => setActiveTab(activeTab - 1)}
        >
          Previous
        </Button>
        <Box color="muted" fontWeight={500} fontSize="12px">
          Step {activeTab} of 3
        </Box>
        <Flex gap={7}>
          {!isFirstStep && (
            <Button
              variant="unstyled"
              cursor="pointer"
              padding={0}
              onClick={() => {
                trackEvent(PostHogEvents.ONBOARDING_WIZARD_STEP_SKIPPED, {
                  step: DebuggerWizardStepNamesMap[activeTab],
                });
                setActiveTab(activeTab + 1);
              }}
            >
              Skip
            </Button>
          )}
          <Button
            onClick={() => {
              trackEvent(PostHogEvents.ONBOARDING_WIZARD_STEP_COMPLETED, {
                step: DebuggerWizardStepNamesMap[activeTab],
                action:
                  activeTab === DebuggerWizardStepsEnum.SetupMCP
                    ? "complete"
                    : "next",
              });
              setActiveTab(activeTab + 1);
            }}
          >
            {activeTab === DebuggerWizardStepsEnum.SetupMCP
              ? "Complete"
              : "Next"}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default DebuggerWizardPagination;
