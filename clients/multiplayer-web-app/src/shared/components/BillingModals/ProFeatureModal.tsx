import {
  Box,
  Button,
  Flex,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";

const ProFeatureModal = ({ disclosure, onContact, onBenefitCheck }) => {
  const { trackEvent } = useAnalytics();

  const onModalClose = () => {
    trackEvent(PostHogEvents.USER_CLOSED_PRO_FEATURE_POPUP, {});
    disclosure.onClose();
  };

  return (
    <Modal
      isCentered
      size="2xl"
      isOpen={disclosure.isOpen}
      closeOnOverlayClick={false}
      onClose={onModalClose}
    >
      <ModalOverlay />
      <ModalContent p="6" borderRadius="3xl" userSelect="none">
        <ModalHeader
          p="0"
          bg="bg.primary"
          borderRadius="24px 24px 0 0"
          ml="220px"
        >
          That’s a paid feature!
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody flexDirection="column" p="0">
          <Box
            height="100%"
            w="220px"
            top="0"
            left="0"
            position="absolute"
            bgSize="100%"
            bgRepeat="no-repeat"
            borderTopLeftRadius="3xl"
            borderBottomLeftRadius="3xl"
            bgImage={`${process.env.PUBLIC_URL}/assets/billing-trial-ended.png`}
          />
          <Flex pt="4" direction="column" width="400px" gap="16" ml="220px">
            <Box>
              <Text color="muted" fontSize="s" mb={8}>
                This is not included in our Free plan. Stop the manual work and
                save time with unlimited system auto-documentation, platform
                debugging, and platform notebooks.
              </Text>
              <Button variant="light" w="full" mb={3} onClick={onModalClose}>
                Continue on the Free plan
              </Button>
              <Button
                w="full"
                as={Link}
                variant="light"
                target="_blank"
                rel="noreferrer"
                onClick={onBenefitCheck}
                href="https://www.multiplayer.app/pricing"
                _hover={{ textDecoration: "none" }}
              >
                See all the benefits of our paid plans
              </Button>
            </Box>
            <Button
              w="full"
              as={Link}
              variant="primary"
              target="_blank"
              rel="noreferrer"
              onClick={onContact}
              href="https://cal.com/multiplayer/30min"
              _hover={{ textDecoration: "none" }}
            >
              Contact us to upgrade
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ProFeatureModal;
