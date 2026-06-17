import { useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalOverlay,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import LazyContent, { lazyModule } from "shared/components/LazyContent";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";

const DebuggerWizard = lazyModule(
  () => import("shared/components/DebuggerWizard"),
);

const ObservabilitySetupModal = ({
  disclosure,
  onCloseComplete,
}: {
  disclosure: UseDisclosureReturn;
  onCloseComplete: () => void;
}) => {
  const { isOpen, onClose } = disclosure;
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (isOpen) {
      trackEvent(PostHogEvents.ONBOARDING_WIZARD_OPENED, {});
    }
  }, [isOpen]);

  const handleCloseComplete = () => {
    trackEvent(PostHogEvents.ONBOARDING_WIZARD_CLOSED, {});
    onCloseComplete();
  };

  return (
    <Modal
      size="full"
      isCentered
      isOpen={isOpen}
      onClose={onClose}
      blockScrollOnMount={false}
      onCloseComplete={handleCloseComplete}
    >
      <ModalOverlay />
      <ModalContent backgroundColor="unset" w="full" h="full" p="8">
        <LazyContent element={<DebuggerWizard onClose={onClose} />} />
      </ModalContent>
    </Modal>
  );
};

export default ObservabilitySetupModal;
