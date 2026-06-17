import { UseDisclosureReturn, useDisclosure } from "@chakra-ui/react";
import { createContext, useContext, useRef } from "react";
import ContactModal from "shared/components/ContactModal";

interface IGeneralModalsContext {
  contactModal: UseDisclosureReturn;
  openContactModal: () => void;
}

interface IGeneralModalsState {
  contactModal: any;
}

export const GeneralModalsContext = createContext<IGeneralModalsContext>(null);

export const GeneralModalsProvider = ({ children }) => {
  const stateRef = useRef<IGeneralModalsState>({
    contactModal: {},
  });
  const contactModal = useDisclosure();

  const openContactModal = () => contactModal.onOpen();

  return (
    <GeneralModalsContext.Provider
      value={{
        contactModal,
        openContactModal,
      }}
    >
      {children}
      <ContactModal disclosure={contactModal} />
    </GeneralModalsContext.Provider>
  );
};

export function useSharedGeneralModals() {
  const context = useContext(GeneralModalsContext);
  if (context === null) {
    throw new Error(
      "useSharedGeneralModals must be used within SharedGeneralModalsProvider"
    );
  }
  return context;
}
