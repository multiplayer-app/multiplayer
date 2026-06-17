import { Outlet } from "react-router-dom";
import { Flex } from "@chakra-ui/react";
import Sidebar from "./Sidebar";
import { useSettingsLayout } from "shared/providers/SettingsLayoutContext";

const SettingsLayout = () => {
  const { isOpen } = useSettingsLayout();

  return (
    <Flex flex="1" minH="0" overflow={{ base: "hidden", md: "visible" }}>
      <Sidebar />
      <Flex
        flex="1"
        minH="0"
        zIndex={2}
        position="relative"
        bg="bg.primary"
        flexDirection="column"
        ml={{ base: isOpen ? "220px" : "0", md: "0" }}
        minW={{ base: "100vw", md: "0" }}
        transition="margin .3s cubic-bezier(.87, 0, .13, 1)"
      >
        <Flex
          flex="1"
          overflow="auto"
          flexDirection="column"
          className="root-content"
        >
          <Outlet />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SettingsLayout;
