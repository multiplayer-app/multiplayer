import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Code,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CheckIcon, CopyIcon } from "@chakra-ui/icons";

const OauthCallback = () => {
  const location = useLocation();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const codeParam = query.get("code");
    const errorParam = query.get("error");

    if (errorParam) {
      setError(errorParam === "access_denied" ? "You denied the authorization request." : errorParam);
      return;
    }

    if (!codeParam) {
      setError("Missing code parameter.");
      return;
    }

    setCode(codeParam);
  }, [location.search]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (error) {
    return (
      <Box maxW="500px" padding="12" pb="6">
        <Stack spacing={4} alignItems="center">
          <Text fontSize="24px" fontWeight="500" textAlign="center">
            Authorization failed
          </Text>
          <Text color="red.400" fontSize="sm" textAlign="center">
            {error}
          </Text>
          <Text color="muted" fontSize="sm" textAlign="center">
            You can close this window and try again.
          </Text>
        </Stack>
      </Box>
    );
  }

  if (!code) {
    return (
      <Box maxW="500px" padding="12" pb="6">
        <Stack spacing={4} alignItems="center">
          <Text color="muted" fontSize="sm">Loading...</Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box maxW="500px" padding="12" pb="6">
      <Stack spacing={6} alignItems="center">
        <Text fontSize="24px" fontWeight="500" textAlign="center" lineHeight="36px">
          Authorization successful
        </Text>
        <Text color="muted" fontSize="sm" textAlign="center">
          Copy the code below and paste it into the CLI to complete authentication.
        </Text>
        <Box
          w="100%"
          borderRadius="lg"
          border="1px solid"
          borderColor="border.primary"
          p={4}
          bg="bg.secondary"
        >
          <Code
            display="block"
            wordBreak="break-all"
            fontSize="sm"
            bg="transparent"
            whiteSpace="pre-wrap"
            textAlign="center"
          >
            {code}
          </Code>
        </Box>
        <Button
          leftIcon={<Icon as={copied ? CheckIcon : CopyIcon} />}
          colorScheme={copied ? "green" : "blue"}
          onClick={handleCopy}
          w="100%"
        >
          {copied ? "Copied!" : "Copy code"}
        </Button>
        <Text color="muted" fontSize="xs" textAlign="center">
          You can close this window after copying the code.
        </Text>
      </Stack>
    </Box>
  );
};

export default OauthCallback;
