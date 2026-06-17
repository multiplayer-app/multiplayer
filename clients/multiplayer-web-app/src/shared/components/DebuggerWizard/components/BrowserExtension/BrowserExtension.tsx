import { Box, Button, Icon, Image, Link, Text } from "@chakra-ui/react";
import { ChromeIcon } from "shared/icons";
import ChromeExtensionImg from "assets/images/wizard/chrome-hero.jpg";
import useMessage from "shared/hooks/useMessage";

const extensionLink =
  "https://chromewebstore.google.com/detail/multiplayer/nkhglmdpkenhkfhcekoblccmgjolfikf";

const BrowserExtension = () => {
  const message = useMessage();

  const handleCopyLink = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(extensionLink);
      message.success("Link successfully copied!");
    } catch (error) {
      message.handleError({ message: "Something went wrong!" });
    }
  };

  return (
    <Box textAlign="center" p={6} mx="auto">
      <Image src={ChromeExtensionImg} w="full" h="auto" mb={16} />

      <Icon as={ChromeIcon} boxSize="66px" mb="8" />

      <Text fontSize="18px" mb={2} fontWeight={600} color="subtle">
        Download our Chrome Extension
      </Text>

      <Box maxWidth="320px" textAlign="center" mx="auto">
        <Text fontSize="sm" color="muted" fontWeight={500} mb={8}>
          The easiest way to debug issues in your platform. Install in seconds,
          debug in minutes.
        </Text>

        <Box display="flex" flexDirection="column" gap={4}>
          <Link
            href={extensionLink}
            isExternal
            rel="noopener noreferrer"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            px="16px"
            py="10px"
            bg="brand.500"
            borderRadius="12px"
            color="inverse"
            border="1px solid"
            borderColor="brand.500"
            textDecoration="none"
            _hover={{ textDecoration: "none" }}
            fontSize="14px"
            fontWeight={500}
          >
            Download from the Chrome Store
          </Link>

          <Button
            variant="outline"
            boxShadow="0px 3px 3px -1.5px #0000000F, 0px 1px 1px -0.5px #0000000F"
            size="lg"
            borderRadius="12px"
            onClick={handleCopyLink}
          >
            Copy the link
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default BrowserExtension;
