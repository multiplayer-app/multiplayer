import { useState } from "react";
import { Box, Flex, Link, Stack, Text } from "@chakra-ui/react";
import {
  BackendSetupStep,
  DebuggerWizardStepsEnum,
  PostHogEvents,
} from "shared/models/enums";
import StepLayout from "shared/components/DebuggerWizard/components/StepLayout";
import { BackendStepContent, BackendSetupMethod } from "./components";
import { BACKEND_SETUP_STEPS } from "shared/configs/wizard.configs";
import { useAnalytics } from "shared/providers/AnalyticsContext";

const BackendStep = ({ setActiveTab }) => {
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [selectedSetupMethod, setSelectedSetupMethod] =
    useState<BackendSetupStep>(null);
  const { trackEvent } = useAnalytics();

  return (
    <Flex gap="10px" justifyContent="center" flex="1" h="full">
      <StepLayout
        title="Choose your backend setup"
        setActiveTab={setActiveTab}
        activeTab={DebuggerWizardStepsEnum.BackendStep}
        description={
          <>
            Capture backend traces, logs, requests / responses <br />
            and headers for truly full stack session recordings.
          </>
        }
        isContentVisible={isContentVisible}
        children={
          <>
            <Text fontSize="md" fontWeight="500" color="subtle" mb={4}>
              Server-side integration
            </Text>
            <Text fontSize="sm" color="muted" mb={4}>
              Multiplayer leverages OpenTelemetry for collecting telemetry data.
              If your services don't already use it, you'll first need to
              install the{" "}
              <Link
                isExternal
                color="brand.500"
                fontWeight="medium"
                href="https://opentelemetry.io/"
                onClick={() =>
                  trackEvent(
                    PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED,
                    {
                      actionSource: "backend step opentelemetry info",
                      href: "https://opentelemetry.io/",
                    }
                  )
                }
              >
                OpenTelemetry libraries
              </Link>
              .
            </Text>
            <Stack gap={4} mb={8}>
              {BACKEND_SETUP_STEPS.map((method, index) => (
                <BackendSetupMethod
                  method={method}
                  key={index}
                  selected={selectedSetupMethod === method.value}
                  setSelected={() => {
                    setSelectedSetupMethod(method.value);
                    setIsContentVisible(true);
                    trackEvent(
                      PostHogEvents.ONBOARDING_WIZARD_BACKEND_STEP_SELECTED,
                      {
                        step: method.title,
                      }
                    );
                  }}
                />
              ))}
            </Stack>
            <Box mb={16}>
              <Text fontSize="md" fontWeight="500" color="subtle" mb={4}>
                Complex setup and/or unsure how to proceed?
              </Text>
              <Text fontSize="sm" color="muted">
                If you’re running multiple collectors, custom pipelines, or
                enterprise-grade environments, we’re here to help.{" "}
                <Link
                  isExternal
                  color="brand.500"
                  fontWeight="medium"
                  href="https://www.multiplayer.app/contact/"
                  onClick={() =>
                    trackEvent(
                      PostHogEvents.ONBOARDING_WIZARD_CONTACT_US_CLICKED,
                      {
                        actionSource: "backend step contact us",
                        href: "https://www.multiplayer.app/contact/",
                      }
                    )
                  }
                >
                  Contact us
                </Link>{" "}
                and we’ll walk you through the right configuration for your
                platform.
              </Text>
            </Box>
          </>
        }
      />
      {isContentVisible && (
        <Box
          width="50%"
          maxW="700px"
          overflow="auto"
          height="full"
          border="1px solid"
          borderColor="border.secondary"
          backgroundColor="bg.primary"
          borderRadius="16px"
          boxShadow="0px 1px 2px 0px #0000000D"
          p={8}
        >
          <BackendStepContent value={selectedSetupMethod} />
          <Text fontSize="sm" color="muted" mt={2} pb={8}>
            For a detailed breakdown of each of these options and step-by-step
            implementation guides, please refer to our{" "}
            <Link
              isExternal
              color="brand.500"
              fontWeight="medium"
              href="https://www.multiplayer.app/docs/configure/configure-multiplayer"
              onClick={() =>
                trackEvent(PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED, {
                  actionSource: "backend step rightpanel docs link",
                  href: "https://www.multiplayer.app/docs/configure/configure-multiplayer",
                })
              }
            >
              comprehensive documentation.
            </Link>
          </Text>
        </Box>
      )}
    </Flex>
  );
};

export default BackendStep;
