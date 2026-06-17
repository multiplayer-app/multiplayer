import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Flex, Icon } from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import { CheckCircleIcon, CloseIcon } from "shared/icons";

const ConnectionAlert = ({ isOnline, isSocketConnected }) => {
  const [hasBeenOffline, setHasBeenOffline] = useState(false);
  const [hasBeenDisconnected, setHasBeenDisconnected] = useState(false);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const { pathname } = useLocation();
  const isDashboard = useMemo(() => pathname.includes("dashboard"), [pathname]);

  useEffect(() => {
    if (!isOnline || (!isSocketConnected && !isDashboard)) {
      setHasBeenOffline(!isOnline);
      setHasBeenDisconnected(!isSocketConnected && !isDashboard);
      setMessage(
        !isOnline
          ? "You have lost connection to the internet."
          : "WebSocket connection lost. Some changes may not be saved."
      );
      setVisible(true);
    } else {
      setMessage(hasBeenOffline ? "You are back online." : "");
      setVisible(hasBeenOffline);

      const timer = setTimeout(() => {
        setVisible(false);
        setHasBeenOffline(false);
        setHasBeenDisconnected(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, isSocketConnected, hasBeenOffline, hasBeenDisconnected]);

  if (!visible) {
    return null;
  }

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      bgColor={
        isOnline && (isSocketConnected || !hasBeenDisconnected)
          ? "green.500"
          : "red.500"
      }
      color="inverse"
      fontWeight="medium"
      width="full"
      minH={12}
      height={12}
      transition="all .2s cubic-bezier(.87, 0, .13, 1)"
      top={0}
      left={0}
      zIndex={999999}
      position="relative"
    >
      <Icon
        as={
          isOnline && (isSocketConnected || !hasBeenDisconnected)
            ? CheckCircleIcon
            : InfoOutlineIcon
        }
        color="inverse"
        mr={3}
      />
      {message}
      <Icon
        as={CloseIcon}
        color="inverse"
        position="absolute"
        top="5px"
        right="5px"
        boxSize="16px"
        cursor="pointer"
        onClick={() => setVisible(false)}
      />
    </Flex>
  );
};

export default ConnectionAlert;
