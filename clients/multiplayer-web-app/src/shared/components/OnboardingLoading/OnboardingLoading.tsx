import { Box, Flex, Icon } from "@chakra-ui/react";

import LoadingAnimation from "shared/components/LoadingAnimation";
import { ReactComponent as Logo } from "assets/images/logo.svg";
import { CheckCircleFilledIcon } from "shared/icons";
import { OnboardingStateEnum } from "shared/models/enums";

const OnboardingLoading = ({ state }: { state: OnboardingStateEnum }) => {
  return (
    <Box position="fixed" top={0} left={0} height="100vh" width="100vw">
      <Box
        background="linear-gradient(180deg, #5047E5 0%, #1AE6F3 100%)"
        transform="rotate(135deg)"
        opacity="10%"
        height="60%"
        width="200%"
        position="absolute"
        top="10%"
        left="-40%"
        filter="blur(60px)"
      />
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
      >
        <Icon
          as={Logo}
          boxSize="57px"
          color="brand.900"
          display="block"
          m="0 auto 30px"
        />
        <Box color="brand.500">
          <ProgressStep
            state={state}
            threshold={OnboardingStateEnum.WorkspaceSetup}
          >
            Setting up your workspace
          </ProgressStep>
          <ProgressStep
            state={state}
            threshold={OnboardingStateEnum.ProjectSetup}
          >
            Adding the content in the right place
          </ProgressStep>
          <ProgressStep state={state} threshold={OnboardingStateEnum.Done}>
            Making things tidy...
          </ProgressStep>
        </Box>
      </Box>
    </Box>
  );
};

const ProgressStep = ({ state, threshold, children }) => (
  <Flex fontWeight={500} mb={3} gap="14px" alignItems="center">
    {state > threshold ? (
      <Icon as={CheckCircleFilledIcon} boxSize={4} color="brand.500" />
    ) : (
      <LoadingAnimation width="16px" height="16px" />
    )}
    {children}
  </Flex>
);

export default OnboardingLoading;
