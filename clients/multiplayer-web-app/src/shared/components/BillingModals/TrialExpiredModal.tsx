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

const TrialExpiredModal = ({
  disclosure,
  trialModalKey,
  onContact,
  onBenefitCheck,
}) => {
  const { trackEvent } = useAnalytics();

  const onModalClose = () => {
    trackEvent(PostHogEvents.USER_REMAINED_ON_FREE_PLAN, {});
    localStorage.setItem(trialModalKey, "true");
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
        <ModalHeader p="0" bg="bg.primary" borderRadius="24px 24px 0 0">
          Your free trial has ended.
        </ModalHeader>
        <ModalCloseButton color="inverse" zIndex="2" />
        <ModalBody flexDirection="column" p="0">
          <Box
            height="100%"
            w="220px"
            top="0"
            right="0"
            position="absolute"
            bgSize="100%"
            bgRepeat="no-repeat"
            borderTopRightRadius="3xl"
            borderBottomRightRadius="3xl"
            bgImage={`${process.env.PUBLIC_URL}/assets/billing-trial-ended.png`}
          />
          <Flex pt="4" direction="column" width="400px" gap="16">
            <Box>
              <Text color="muted" fontSize="s" mb={8}>
                Enjoyed your trial? Upgrade to continue getting all the features
                and support. Otherwise, we'll help you downgrade to our Free
                plan.
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

export default TrialExpiredModal;
