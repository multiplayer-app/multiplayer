import { Box, Button, Flex, Img, Link, Text } from "@chakra-ui/react";
import { PostHogEvents } from "shared/models/enums";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import CliInstallCommandBox from "shared/components/CliInstallCommandBox/CliInstallCommandBox";
import RealtimeCursor from "assets/images/wizard/Realtime Cursor.svg";
import RealtimeCursor1 from "assets/images/wizard/Realtime Cursor-1.svg";
import RealtimeCursor2 from "assets/images/wizard/Realtime Cursor-2.svg";
import RealtimeCursor3 from "assets/images/wizard/Realtime Cursor-3.svg";
import WelcomeImage from "assets/images/wizard/welcome-img.png";

const VIDEO_URL = "https://www.youtube.com/watch?v=nz_T5fQOiTI";

const WelcomeStep = ({ onClose }) => {
  const { trackEvent } = useAnalytics();

  return (
    <Flex alignItems="center" justifyContent="center" flex="1" py="3">
      <Flex
        flex="1"
        w="full"
        h="full"
        minH="0"
        direction="column"
        alignItems="center"
        justifyContent="flex-start"
        border="1px solid"
        borderColor="border.secondary"
        backgroundColor="bg.primary"
        borderRadius="16px"
        boxShadow="0px 1px 2px 0px #0000000D"
        px={{ base: "6", md: "12" }}
        py={{ base: "10", md: "12" }}
        maxW="920px"
        position="relative"
        textAlign="center"
      >
        <RealtimeCursors />
        <Flex
          flex="1"
          w="full"
          minH="0"
          direction="column"
          alignItems="center"
          justifyContent="flex-start"
        >
          <Text fontSize="lg" fontWeight={700} mb="2" color="body">
            Welcome!
          </Text>

          <Text fontSize="sm" color="body" maxW="560px" mb="5">
            To get started it’s one copy/paste into your terminal 👇 <br /> and
            you’re done.
          </Text>

          <Box w="full" maxW="560px" mb="5" flexShrink={0}>
            <CliInstallCommandBox />
          </Box>

          <Text fontSize="sm" color="body" maxW="620px" mb="5">
            Still making up your mind? Check out this 1 min video of how
            Multiplayer connects your favorite coding agent to prod to fix
            application bugs automatically.
          </Text>

          <Link
            href={VIDEO_URL}
            isExternal
            w="full"
            maxW="620px"
            mb="5"
            _hover={{ textDecor: "none" }}
          >
            <Box
              position="relative"
              overflow="hidden"
              borderRadius="20px"
              h="calc(100vh - 580px)"
            >
              <Img
                src={WelcomeImage}
                alt="Multiplayer debugger introduction video preview"
                w="full"
                h="full"
                objectFit="contain"
              />
              <Flex
                position="absolute"
                inset="0"
                alignItems="center"
                justifyContent="center"
              >
                <Flex
                  boxSize={{ base: "16", md: "18" }}
                  borderRadius="full"
                  bg="blackAlpha.700"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0px 8px 24px rgba(0, 0, 0, 0.24)"
                >
                  <Box
                    ml="1"
                    width="0"
                    height="0"
                    borderTop="12px solid transparent"
                    borderBottom="12px solid transparent"
                    borderLeft="18px solid white"
                  />
                </Flex>
              </Flex>
            </Box>
          </Link>
        </Flex>

        <Box pt="2" flexShrink={0}>
          <Button
            p="10px 60px"
            type="button"
            backgroundColor="brand.500"
            onClick={() => {
              trackEvent(
                PostHogEvents.ONBOARDING_WIZARD_GET_STARTED_CLICKED,
                {},
              );
              trackEvent(
                PostHogEvents.ONBOARDING_WIZARD_COMPLETED_ALL_STEPS,
                {},
              );
              onClose();
            }}
          >
            Get started
          </Button>
        </Box>
      </Flex>
    </Flex>
  );
};

const RealtimeCursors = () => (
  <>
    <Img src={RealtimeCursor} position="absolute" bottom="90px" left="-50px" />
    <Img src={RealtimeCursor1} position="absolute" top="70px" right="-54px" />
    <Img src={RealtimeCursor2} position="absolute" top="-18px" left="40px" />
    <Img
      src={RealtimeCursor3}
      position="absolute"
      bottom="24px"
      right="-30px"
    />
  </>
);

export default WelcomeStep;
