import { Box, Image, Text } from "@chakra-ui/react";
import ComingSoonImg from "assets/images/wizard/content-coming-soon.png";

const TracesComingSoon = () => {
  return (
    <Box textAlign="center" mx="auto">
      <Image src={ComingSoonImg} w="full" h="auto" mb={15} />
      <Text fontSize="18px" mb={2} fontWeight={600} color="subtle">
        Adding content to your traces is coming soon.
      </Text>
      <Text fontSize="sm" color="muted" fontWeight={500}>
        The easiest way to debug issues in your platform. <br />
        Install in seconds, debug in minutes.
      </Text>
    </Box>
  );
};

export default TracesComingSoon;
