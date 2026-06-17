import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
} from "@chakra-ui/react";
import { CopyIcon, KeyIcon } from "shared/icons";
import useMessage from "shared/hooks/useMessage";

const OpenTelemetryKeyCard = () => {
  const message = useMessage();
  const key = "OTL_YWYfb1php-fpmognthcj";

  const onCopy = () => {
    try {
      navigator.clipboard.writeText(key);
      message.success("Successfully copied!");
    } catch (error) {
      message.handleError({ message: "Something went wrong!" });
    }
  };

  return (
    <Box
      p="4"
      borderRadius="16px"
      bg="bg.subtle"
      border="0.5px solid"
      borderColor="border.secondary"
    >
      <Flex
        w="full"
        justifyContent="space-between"
        alignItems="center"
        gap="10"
        mb={4}
      >
        <Text fontWeight="500" fontSize="16px" color="subtle">
          OpenTelemetry Key
        </Text>
        <Button
          leftIcon={<Icon as={KeyIcon} boxSize={4} mr="10px" />}
          size="md"
          variant="unstyled"
          colorScheme="blue"
          display="flex"
          alignItems="center"
          padding="12px 18px"
          backgroundColor="bg.primary"
          borderRadius="12px"
          border="1px solid"
          borderColor="border.secondary"
          color="subtle"
          boxShadow="0px 3px 3px -1.5px #0000000F, 0px 1px 1px -0.5px #0000000F"
        >
          Generate key
        </Button>
      </Flex>

      <Flex align="center" gap="2">
        <InputGroup
          boxShadow="0px 3px 3px -1.5px #0000000F, 0px 1px 1px -0.5px #0000000F"
          borderRadius="12px"
          backgroundColor="bg.primary"
        >
          <Input
            value={key}
            isReadOnly
            size="md"
            cursor="default"
            _readOnly={{
              backgroundColor: "bg.primary",
            }}
            _focus={{
              borderColor: "border.tertiary",
              boxShadow: "unset",
            }}
            backgroundColor="bg.primary"
            borderRadius="12px"
            padding="10px 12px"
            border="1px solid"
            borderColor="border.tertiary"
          />
          <InputRightElement>
            <Button
              onClick={onCopy}
              size="sm"
              variant="ghost"
              aria-label="Copy key"
              _hover={{
                background: "unset",
              }}
            >
              <Icon as={CopyIcon} boxSize="14px" color="muted" />
            </Button>
          </InputRightElement>
        </InputGroup>
      </Flex>

      <Text mt="4" fontSize="sm" color="muted" fontWeight={500}>
        Save this key securely. You’ll need it for your collection
        configuration.
      </Text>
    </Box>
  );
};

export default OpenTelemetryKeyCard;
