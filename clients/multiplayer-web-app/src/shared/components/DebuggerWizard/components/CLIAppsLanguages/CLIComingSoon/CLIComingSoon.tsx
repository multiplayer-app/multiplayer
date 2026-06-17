import { Image, Box, Text } from "@chakra-ui/react";
import CLIComingSoonImg from "assets/images/wizard/cli-coming-soon.png";

const CLIComingSoon = () => {
  return (
    <Box textAlign="center" mx="auto">
      <Image src={CLIComingSoonImg} w="full" h="auto" mb={15} />
      <Text fontSize="18px" mb={2} fontWeight={600} color="subtle">
        Coming soon to your favorite terminal.
      </Text>
      <Text fontSize="sm" color="muted" fontWeight={500}>
        The easiest way to debug issues in your platform. <br />
        Install in seconds, debug in minutes.
      </Text>
    </Box>
  );
};

export default CLIComingSoon;
