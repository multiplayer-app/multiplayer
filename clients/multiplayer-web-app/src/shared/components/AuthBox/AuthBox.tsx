import { Link } from "react-router-dom";
import { Box, useColorModeValue } from "@chakra-ui/react";

import { ReactComponent as LogoDark } from "assets/images/logo-full.svg";
import { ReactComponent as LogoLight } from "assets/images/logo-white.svg";

const AuthBox = ({ children }) => {
  const Logo = useColorModeValue(LogoDark, LogoLight);
  return (
    <Box
      w="calc(100% - 16px)"
      maxW="500px"
      padding="12"
      marginX="auto"
      mb="3"
      bgColor="bg.primary"
      borderWidth="1px"
      borderRadius="2xl"
      backgroundSize="cover"
      backgroundRepeat="repeat-x"
      borderColor="border.secondary"
      backgroundPosition="top center"
      backgroundImage={`${process.env.PUBLIC_URL}/assets/background.svg`}
    >
      <Link
        to="/auth"
        style={{ position: "relative", display: "block", marginBottom: "30px" }}
      >
        <Logo height="48px" width="100%" />
      </Link>
      {children}
    </Box>
  );
};

export default AuthBox;
