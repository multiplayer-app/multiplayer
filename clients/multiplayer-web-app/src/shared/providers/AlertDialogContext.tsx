import {
  createContext,
  useContext,
  useState,
  useRef,
  MutableRefObject,
} from "react";
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  useDisclosure,
  Portal,
} from "@chakra-ui/react";

export enum AlertTypes {
  DELETE_CONFIRMATION = "delete",
  WARNING = "warning",
}

interface IDialogOptions {
  type: AlertTypes;
  title: string;
  description: string;
  closeBtnLabel: string;
  confirmBtnLabel: string;
  showConfirmButton: boolean;
}

const DefaultAlertProps = {
  type: AlertTypes.DELETE_CONFIRMATION,
  title: "Delete",
  description: "You can't undo this action afterwards.",
  closeBtnLabel: "Cancel",
  confirmBtnLabel: "Delete",
  showConfirmButton: true,
};

const AlertDialogContext = createContext(null);

export const AlertDialogProvider = ({ children }) => {
  const resolveRef = useRef(null);
  const confirmRef = useRef();
  const [containerRef, setContainerRef] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [alertData, setAlertData] = useState(DefaultAlertProps);

  const openAlertDialog = (
    options: IDialogOptions,
    ref?: MutableRefObject<HTMLDivElement>
  ) => {
    if (ref) {
      setContainerRef(ref);
    }
    setAlertData({
      ...DefaultAlertProps,
      ...options,
    });
    onOpen();

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const onDialogClose = (): void => {
    onClose();
    if (resolveRef.current) {
      resolveRef.current(false);
    }
  };

  const onConfirm = (): void => {
    onClose();
    if (resolveRef.current) {
      resolveRef.current(true);
    }
  };

  const confirmButtonVariant = (): string => {
    switch (type) {
      case AlertTypes.DELETE_CONFIRMATION:
        return "danger";
      default:
        return "primary";
    }
  };

  const {
    title,
    type,
    description,
    closeBtnLabel,
    confirmBtnLabel,
    showConfirmButton,
  } = alertData;

  return (
    <AlertDialogContext.Provider
      value={{
        openAlertDialog,
      }}
    >
      {children}
      <Portal containerRef={containerRef}>
        <AlertDialog
          leastDestructiveRef={confirmRef}
          onClose={onDialogClose}
          isOpen={isOpen}
          isCentered
        >
          <AlertDialogOverlay />
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" pr={8}>
              {title}
            </AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>{description}</AlertDialogBody>
            <AlertDialogFooter>
              {closeBtnLabel ? (
                <Button onClick={onDialogClose} variant="light">
                  {closeBtnLabel}
                </Button>
              ) : null}
              {showConfirmButton ? (
                <Button
                  ml={3}
                  ref={confirmRef}
                  textTransform="capitalize"
                  onClick={onConfirm}
                  variant={confirmButtonVariant()}
                >
                  {confirmBtnLabel}
                </Button>
              ) : null}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Portal>
    </AlertDialogContext.Provider>
  );
};

export function useAlertDialog() {
  const context = useContext(AlertDialogContext);
  if (context === null) {
    throw new Error("useAlertDialog must be used within AlertDialogProvider");
  }
  return context;
}
