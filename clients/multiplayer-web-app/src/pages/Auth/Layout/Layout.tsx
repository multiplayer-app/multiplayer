import { Outlet } from "react-router-dom";
import { Box, Flex, Image, useColorModeValue } from "@chakra-ui/react";

const Layout = () => {
  const overlayBg = useColorModeValue(
    "color-mix(in srgb, rgb(129 129 129) 75%, transparent)",
    "color-mix(in srgb, rgb(91 91 91) 75%, transparent)",
  );

  return (
    <Flex
      flex="1"
      minH="0"
      pt="14vh"
      bg="bg.primary"
      overflow="auto"
      direction="column"
      alignItems="center"
      justifyContent="start"
      position="relative"
    >
      <Image
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
        src={`${process.env.PUBLIC_URL}/assets/auth-bg.jpg`}
        style={{
          position: "absolute",
          height: "100%",
          width: "100%",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "white",
          objectFit: "contain",
          filter: "blur(1.5px)",
        }}
      />
      <Box position="absolute" inset="0" bg={overlayBg} />
      <Box position="relative" maxW="900px" w="80vw">
        <Outlet />
      </Box>
    </Flex>
  );
};

export default Layout;
