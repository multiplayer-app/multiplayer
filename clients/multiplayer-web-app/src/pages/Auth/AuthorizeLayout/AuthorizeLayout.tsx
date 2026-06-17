import { Outlet } from "react-router-dom";
import { Flex, Box } from "@chakra-ui/react";
import { ReactComponent as Logo } from "assets/images/logo.svg";

const AuthorizeLayout = () => {
  return (
    <Flex
      flex="1"
      minH="100%"
      direction="column"
      alignItems="center"
      justifyContent="start"
      pt="14vh"
      bgColor="bg.primary"
      backgroundSize="calc(100% + 40px)"
      backgroundRepeat="repeat-x"
      backgroundPosition="top center"
      backgroundImage={`${process.env.PUBLIC_URL}/assets/background.svg`}
    >
      <Box
        w="120px"
        h="120px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="full"
        bg="#473CFB"
        mb={5}
        flexShrink={0}
        transition="background 0.2s"
        overflow="visible"
        position="relative"
      >
        {[...Array(4)].map((_, i) => (
          <Box
            key={i}
            position="absolute"
            margin="2px"
            padding={`${60 * (i + 2) - 2}px`}
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex="1"
            sx={{
              borderRadius: "50%",
              border: "1px solid transparent" /*2*/,
              background: `linear-gradient(180deg, rgba(102, 102, 102, 0.15) 0%, rgba(0, 0, 0, ${
                i === 0 ? 0.1 : 0
              }) 100%)`,
              mask: "linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0)",
              maskComposite: "exclude",
              backgroundPositionY: "1px",
            }}
          />
        ))}

        <Logo
          height="80px"
          width="80px"
          style={{ display: "block", color: "white" }}
        />
      </Box>
      <Flex
        zIndex="2"
        mt="12"
        direction="column"
        alignItems="center"
        justifyContent="center"
      >
        <Outlet />
      </Flex>
    </Flex>
  );
};

export default AuthorizeLayout;
