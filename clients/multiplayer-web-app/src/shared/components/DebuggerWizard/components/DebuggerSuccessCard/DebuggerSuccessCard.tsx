import { Box, Button, Center, Icon, Text, VStack } from "@chakra-ui/react";
import { CheckCircleFilledIcon } from "shared/icons";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";
import confetti from "assets/images/confetti.svg";

const DebuggerSuccessCard = ({ onClose }) => {
  const { trackEvent } = useAnalytics();
  return (
    <Box
      w="full"
      maxW="4xl"
      mx="auto"
      bg="bg.primary"
      borderRadius="16px"
      boxShadow="0px 1px 2px 0px #0000000D"
      p={16}
      textAlign="center"
      position="relative"
    >
      <Box
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="30%"
        bgImage={confetti}
        bgSize="cover"
        bgRepeat="no-repeat"
        bgPosition="bottom"
        zIndex="0"
      />
      <VStack>
        <Center w="16" h="16" bg="brand.500" borderRadius="16" mb={6}>
          <Icon as={CheckCircleFilledIcon} boxSize={10} color="inverse" />
        </Center>

        <Text fontSize="xl" fontWeight="semibold" mb={4}>
          You’ve successfully set up the Multiplayer.
        </Text>

        <Button
          backgroundColor="brand.500"
          px={10}
          borderRadius="12px"
          width="268px"
          _hover={{ backgroundColor: "brand.700" }}
          onClick={() => {
            trackEvent(
              PostHogEvents.ONBOARDING_WIZARD_SUCCESS_CLOSE_CLICKED,
              {}
            );
            trackEvent(PostHogEvents.ONBOARDING_WIZARD_COMPLETED_ALL_STEPS, {});
            onClose();
          }}
        >
          Close
        </Button>
      </VStack>
    </Box>
  );
};

export default DebuggerSuccessCard;
