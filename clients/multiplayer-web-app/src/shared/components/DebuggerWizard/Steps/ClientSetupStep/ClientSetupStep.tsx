import { useState } from "react";
import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { ReactComponent as ChromeExtension } from "assets/images/wizard/chrome-extention.svg";
import { ReactComponent as CLIAppsIcon } from "assets/images/wizard/cli-apps.svg";
import { ReactComponent as JsLibrary } from "assets/images/wizard/js-library.svg";
import { ReactComponent as Mobile } from "assets/images/wizard/mobile.svg";
import {
  DebuggerWizardStepsEnum,
  ClientSetupMethod,
  PostHogEvents,
} from "shared/models/enums";
import {
  CLIENT_SETUP_METHODS,
  MOBILE_SETUP_METHODS,
} from "shared/configs/wizard.configs";
import ClientLibrary from "shared/components/DebuggerWizard/components/ClientLibrary";
import CLIApps from "shared/components/DebuggerWizard/components/CLIApps";
import BrowserExtension from "shared/components/DebuggerWizard/components/BrowserExtension";
import MobileApps from "shared/components/DebuggerWizard/components/MobileApps";
import StepLayout from "shared/components/DebuggerWizard/components/StepLayout";
import { useAnalytics } from "shared/providers/AnalyticsContext";

const ICON_MAP = {
  ChromeExtension,
  CLIAppsIcon,
  JsLibrary,
  Mobile,
};

const SetupMethod = ({ method, selected, setSelected }) => {
  const { headerText, label, value, description, iconName, isDisabled } =
    method;
  const IconComponent = ICON_MAP[iconName];
  return (
    <Box
      borderRadius="16px"
      cursor={isDisabled ? "default" : "pointer"}
      onClick={() => !isDisabled && setSelected()}
      p={4}
      bg={selected ? "rgba(73, 59, 255, 0.05)" : "bg.subtle"}
      border="1px solid"
      borderColor={selected ? "brand.500" : "bg.muted"}
      outline={selected ? "1px solid" : "0"}
      outlineColor={selected ? "brand.500" : "transparent"}
      outlineOffset={0}
      _hover={
        !selected && { border: "1px solid", borderColor: "border.tertiary" }
      }
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        mb={4}
        gap="10px"
      >
        <Flex gap={4} alignItems="center">
          <Icon as={IconComponent} width={8} height={8} />
          <Text color="subtle" fontWeight={500} fontSize="16px">
            {headerText}
          </Text>
          {label && (
            <Box
              backgroundColor={
                value !== ClientSetupMethod.ClientLibrary
                  ? "bg.subtle"
                  : "green.100"
              }
              color={
                value !== ClientSetupMethod.ClientLibrary
                  ? "muted"
                  : "green.400"
              }
              px={1}
              border={
                value !== ClientSetupMethod.ClientLibrary
                  ? "0.5px solid bg.muted"
                  : "0.5px solid green.200"
              }
              borderRadius="6px"
              fontSize="12px"
              fontWeight={500}
              lineHeight="20px"
            >
              {label}
            </Box>
          )}
        </Flex>
        <Box
          width={6}
          height={6}
          borderRadius="50%"
          border="1px solid"
          flexShrink={0}
          opacity={isDisabled ? "0.2" : "1"}
          backgroundColor={selected ? "brand.500" : "bg.primary"}
          borderColor={selected ? "brand.500" : "muted"}
          position="relative"
        >
          {selected && (
            <Box
              position="absolute"
              width={3}
              height={3}
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              backgroundColor="bg.primary"
              borderRadius="50%"
            />
          )}
        </Box>
      </Flex>
      <Text color="muted" fontSize="14px">
        {description}
      </Text>
    </Box>
  );
};

const ClientSetupStep = ({ setActiveTab }) => {
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const { trackEvent } = useAnalytics();
  return (
    <Flex gap="10px" justifyContent="center" flex="1" h="full">
      <StepLayout
        title="Set up your clients"
        setActiveTab={setActiveTab}
        activeTab={DebuggerWizardStepsEnum.ClientSetupStep}
        description="The first step in achieving full stack session"
        isContentVisible={isContentVisible}
        children={
          <Stack gap={4} mb={16}>
            <Text fontSize="18px" color="subtle" fontWeight={600}>
              Web applications
            </Text>
            {CLIENT_SETUP_METHODS.map((method, index) => (
              <SetupMethod
                method={method}
                key={index}
                selected={selectedMethod === method.value}
                setSelected={() => {
                  setSelectedMethod(method.value);
                  setIsContentVisible(true);
                  trackEvent(
                    PostHogEvents.ONBOARDING_WIZARD_CLIENT_METHOD_SELECTED,
                    {
                      method: method.headerText,
                    }
                  );
                }}
              />
            ))}

            <Text fontSize="18px" color="subtle" fontWeight={600} mt={2}>
              Mobile applications
            </Text>
            {MOBILE_SETUP_METHODS.map((method, index) => (
              <SetupMethod
                method={method}
                key={index}
                selected={selectedMethod === method.value}
                setSelected={() => {
                  setSelectedMethod(method.value);
                  setIsContentVisible(true);
                  trackEvent(
                    PostHogEvents.ONBOARDING_WIZARD_CLIENT_METHOD_SELECTED,
                    {
                      method: method.headerText,
                    }
                  );
                }}
              />
            ))}
          </Stack>
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
          p={8}
          key={selectedMethod}
        >
          <Box textAlign="left" w="full" h="full">
            {selectedMethod === ClientSetupMethod.ClientLibrary ? (
              <ClientLibrary />
            ) : selectedMethod === ClientSetupMethod.CLIApps ? (
              <CLIApps />
            ) : selectedMethod === ClientSetupMethod.Mobile ? (
              <MobileApps />
            ) : (
              <BrowserExtension />
            )}
          </Box>
        </Box>
      )}
    </Flex>
  );
};

export default ClientSetupStep;
