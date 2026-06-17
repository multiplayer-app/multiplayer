import { useDisclosure, UseDisclosureReturn } from "@chakra-ui/react";

const toggleDisclosure = (
  condition: boolean,
  disclosure: UseDisclosureReturn
) => {
  if (condition && !disclosure.isOpen) {
    disclosure.onOpen();
  } else if (!condition && disclosure.isOpen) {
    disclosure.onClose();
  }
};

const useDebugSessionDisclosureState = () => {
  const viewsDisclosure = useDisclosure();
  const nodeDetailsDrawerDisclosure = useDisclosure();
  const notesDrawerDisclosure = useDisclosure();

  return {
    viewsDisclosure,
    nodeDetailsDrawerDisclosure,
    notesDrawerDisclosure,
  };
};

export default useDebugSessionDisclosureState;
