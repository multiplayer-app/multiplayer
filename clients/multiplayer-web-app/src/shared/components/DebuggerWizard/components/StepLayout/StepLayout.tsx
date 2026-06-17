import { ReactNode } from "react";
import { Box, Text, VStack } from "@chakra-ui/react";

import DebuggerWizardPagination from "shared/components/DebuggerWizard/DebuggerWizardPagination";
import { DebuggerWizardStepsEnum } from "shared/models/enums";

interface StepLayoutProps {
  title: string;
  description: string | ReactNode;
  children: ReactNode;
  activeTab: DebuggerWizardStepsEnum;
  setActiveTab: (tab: DebuggerWizardStepsEnum) => void;
  isContentVisible?: boolean;
  label?: string;
  isRecommendedStep?: boolean;
}

const StepLayout = ({
  title,
  label,
  isRecommendedStep,
  description,
  children,
  activeTab,
  setActiveTab,
  isContentVisible,
}: StepLayoutProps) => (
  <Box
    border="1px solid"
    borderColor="border.secondary"
    backgroundColor="bg.primary"
    borderRadius="16px"
    boxShadow="0px 1px 2px 0px #0000000D"
    p={8}
    pb={0}
    maxW="700px"
    maxHeight="full"
    position="relative"
    overflow="auto"
    w={isContentVisible ? "50%" : "100%"}
  >
    <Box textAlign="center" mb={8}>
      <VStack
        alignItems="center"
        gap={1}
        w="full"
        justifyContent="center"
        mb={2}
      >
        {label && (
          <Box
            backgroundColor={isRecommendedStep ? "green.100" : "bg.subtle"}
            color={isRecommendedStep ? "green.400" : "muted"}
            px={1}
            border="0.5px solid"
            borderColor={isRecommendedStep ? "green.200" : "bg.muted"}
            borderRadius="6px"
            fontSize="12px"
            lineHeight="20px"
            boxShadow="0px -1px 1px 0px #7180961A inset, 0px 1px 1px 0px #FFFFFF80 inset"
          >
            {label}
          </Box>
        )}
        <Text color="subtle" fontWeight={600} fontSize="16px">
          {title}
        </Text>
      </VStack>
      <Text color="muted" fontWeight={500} fontSize="14px">
        {description}
      </Text>
    </Box>
    {children}
    <DebuggerWizardPagination
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  </Box>
);

export default StepLayout;
