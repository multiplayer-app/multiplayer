import {
  Flex,
  IconButton,
  Tabs,
  Tab,
  TabList,
  Text,
  Box,
  Icon,
} from "@chakra-ui/react";
import { CheckmarkIcon, CloseIcon } from "shared/icons";
import { DebuggerWizardStepsEnum, PostHogEvents } from "shared/models/enums";
import { ReactComponent as Logo } from "assets/images/logo.svg";
import {
  DebuggerWizardStepNamesMap,
  WIZARD_STEPS,
} from "shared/configs/wizard.configs";
import { useAnalytics } from "shared/providers/AnalyticsContext";

const DebuggerWizardHeader = ({ onClose, activeTab, setActiveTab }) => {
  const { trackEvent } = useAnalytics();
  return (
    <Flex
      padding="12px 18px"
      justifyContent="space-between"
      borderBottom="1px solid #0000000A"
      backgroundColor="bg.primary"
      alignItems="center"
      height="64px"
    >
      <Logo
        height="35px"
        width="35px"
        style={{ display: "block", color: "#473CFB" }}
      />
      {activeTab !== DebuggerWizardStepsEnum.WelcomeStep && (
        <Tabs index={activeTab}>
          <TabList gap="48px" border="none">
            {WIZARD_STEPS.map((step) => (
              <Tab
                key={step.value}
                disabled={activeTab >= step.value}
                flex={1}
                padding="0"
                _after={{ display: "none" }}
                onClick={() => setActiveTab(step.value)}
              >
                <TabIcon
                  number={step.value}
                  isActive={activeTab === step.value}
                  isPassed={activeTab > step.value}
                />
                <Box textAlign="left" ml="10px" whiteSpace="nowrap">
                  <Text fontSize="14px" fontWeight={500} color="body">
                    {step.title}
                  </Text>
                  <Text fontSize="12px" color="muted">
                    {step.subtitle}
                  </Text>
                </Box>
              </Tab>
            ))}
          </TabList>
        </Tabs>
      )}
      <IconButton
        size="sm"
        backgroundColor="bg.subtle"
        borderRadius="8px"
        variant="base"
        aria-label="close"
        icon={<Icon boxSize="16px" as={CloseIcon} color="muted" />}
        onClick={() => {
          trackEvent(PostHogEvents.ONBOARDING_WIZARD_EXITED_EARLY, {
            step: DebuggerWizardStepNamesMap[activeTab],
            actionSource: "Closed from header x button",
          });
          onClose();
        }}
      />
    </Flex>
  );
};

const TabIcon = ({ number, isActive, isPassed }) => {
  return (
    <Flex
      width="32px"
      height="32px"
      borderRadius="50%"
      alignItems="center"
      justifyContent="center"
      color="inverse"
      backgroundColor={
        isActive ? "brand.500" : isPassed ? "green.400" : "muted"
      }
    >
      {isPassed ? (
        <Icon as={CheckmarkIcon} color="inverse" />
      ) : (
        <Text>{number}</Text>
      )}
    </Flex>
  );
};

export default DebuggerWizardHeader;
