import { useCallback } from "react";
import { useDisclosure } from "@chakra-ui/react";

const MOBILE_BREAKPOINT = 600;

export const useMobileExperienceModal = () => {
  const disclosure = useDisclosure();

  const isMobileViewport = useCallback(() => {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }, []);

  const onCloseMobileModal = useCallback(() => {
    disclosure.onClose();
  }, [disclosure]);

  const onOpenMobileModal = useCallback(() => {
    disclosure.onOpen();
  }, [disclosure]);

  return {
    isOpen: disclosure.isOpen,
    onClose: onCloseMobileModal,
    onOpen: onOpenMobileModal,
    isMobileViewport,
  };
};
