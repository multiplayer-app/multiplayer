import React, { useCallback, useMemo } from "react";
import { useToast } from "@chakra-ui/react";
import ToastContent from "shared/components/ToastContent";

const useMessage = () => {
  const toast = useToast();

  const handleError = useCallback(
    (error, duration: number = 6000) => {
      if (error.isHandled) return;
      toast({
        status: "error",
        isClosable: true,
        duration,
        position: "bottom-left",
        render: ({ onClose }) => (
          <ToastContent status="error" onClose={onClose}>
            {error.message || "Something went wrong!"}
          </ToastContent>
        ),
      });
    },
    [toast]
  );

  const warning = useCallback(
    (message: string | React.ReactNode, duration: number = 6000) => {
      toast({
        status: "warning",
        isClosable: true,
        duration,
        position: "bottom-left",
        render: ({ onClose }) => (
          <ToastContent status="warning" onClose={onClose}>
            {message}
          </ToastContent>
        ),
      });
    },
    [toast]
  );

  const success = useCallback(
    (message: string | React.ReactNode, duration: number = 6000) => {
      toast({
        status: "success",
        isClosable: true,
        duration,
        position: "bottom-left",
        render: ({ onClose }) => (
          <ToastContent status="success" onClose={onClose}>
            {message}
          </ToastContent>
        ),
      });
    },
    [toast]
  );

  return useMemo(
    () => ({ handleError, success, warning }),
    [handleError, success, warning]
  );
};

export default useMessage;
