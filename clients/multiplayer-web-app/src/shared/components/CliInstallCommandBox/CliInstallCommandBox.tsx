import { Box } from "@chakra-ui/react";

import CopySyntax from "shared/components/DebuggerWizard/components/CopySyntax";
import { MULTIPLAYER_CLI_INSTALL_COMMAND } from "shared/constants/multiplayerCli";

/** Matches corp / marketing terminal styling: npm accent, -g flag, rest neutral. */
const CLI_SYNTAX = {
  npm: "#E879F9",
  flag: "#4ADE80",
  rest: "#FFFFFF",
} as const;

const CliInstallCommandBox = () => {
  return (
    <Box
      w="full"
      position="relative"
      bg="#222222"
      borderRadius="16px"
      px="4"
      py="3"
      textAlign="left"
      fontFamily="mono"
      fontSize="sm"
    >
      <Box as="span" pr="12" display="block">
        <Box as="span" color={CLI_SYNTAX.npm}>
          npm
        </Box>
        <Box as="span" color={CLI_SYNTAX.rest}>
          {" "}
          install{" "}
        </Box>
        <Box as="span" color={CLI_SYNTAX.flag}>
          -g
        </Box>
        <Box as="span" color={CLI_SYNTAX.rest}>
          {" "}
          @multiplayer-app/cli && multiplayer
        </Box>
      </Box>
      <CopySyntax
        value={MULTIPLAYER_CLI_INSTALL_COMMAND}
        props={{
          top: "50%",
          right: "16px",
          transform: "translateY(-50%)",
          color: "whiteAlpha.800",
          backgroundColor: "transparent",
          boxSize: 5,
        }}
      />
    </Box>
  );
};

export default CliInstallCommandBox;
