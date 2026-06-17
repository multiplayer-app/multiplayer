import {
  Button,
  Flex,
  Image,
  Stack,
  Tag,
  TagLabel,
  Text,
  useToken,
} from "@chakra-ui/react";
import AISparkle from "assets/images/ai-assist-sparkle.svg";

const PlatformCreationModeSelector = ({
  createWithAI,
  fromOnboarding = false,
}) => {
  const [gray100] = useToken("colors", ["bg.subtle"]);

  return (
    <Flex flexWrap="wrap" justifyContent="space-between">
      <Stack
        borderColor="border.tertiary"
        borderWidth="1px"
        borderRadius={8}
        boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        px={[4, 4, 4, 8]}
        py={8}
        mb={[4, 4, 0]}
        width={["100%", "100%", "48%"]}
        _hover={{
          boxShadow: `0 0 0 1px ${gray100}`,
        }}
        alignItems="center"
        justifyContent="space-between"
        cursor="pointer"
        onClick={() => createWithAI(false)}
      >
        <Stack alignItems="center">
          <Image src={AISparkle} w="98px" mb={8} />
          <Text
            textAlign="center"
            fontWeight="medium"
            color="subtle"
            fontSize="md"
          >
            Upload an existing image of your system diagram and we’ll help you
            create a list of your components.
          </Text>
        </Stack>

        <Button w="100%" colorScheme="blue" type="submit" mt={6}>
          Use AI Assist
        </Button>
      </Stack>
      <Stack
        borderColor="border.tertiary"
        borderWidth="1px"
        borderRadius={8}
        boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        px={[4, 4, 4, 8]}
        py={8}
        width={["100%", "100%", "48%"]}
        _hover={{
          boxShadow: `0 0 0 1px ${gray100}`,
        }}
        alignItems="center"
        justifyContent="space-between"
        cursor="pointer"
        onClick={() => createWithAI(true)}
      >
        <Stack alignItems="center">
          <Tag
            size="sm"
            variant="basic"
            backgroundColor="bg.subtle"
            borderRadius={10}
            borderWidth="1px"
            borderColor="rgba(0, 0, 0, 0.06)"
            p="2px 10px"
            mb={8}
          >
            <TagLabel>1-2 minutes</TagLabel>
          </Tag>
          <Text
            textAlign="center"
            fontWeight="medium"
            color="subtle"
            fontSize="md"
          >
            Manually create a platform and add your{" "}
            {fromOnboarding ? "first" : ""} components.
          </Text>
        </Stack>

        <Button
          w="100%"
          colorScheme="blue"
          type="submit"
          mt={6}
          textOverflow="wrap"
        >
          Continue with manual process
        </Button>
      </Stack>
    </Flex>
  );
};

export default PlatformCreationModeSelector;
