import {
  Box,
  Heading,
  Img,
  Link,
  Text,
  List,
  ListItem,
} from "@chakra-ui/react";
import GenerateOpenTelemetryToken from "shared/components/GenerateOpenTelemetryToken";
import CLIDiagram from "assets/images/wizard/cli.svg";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";

const GenerateCLIToken = ({ handleTokenGenerated }) => {
  return (
    <>
      <Text fontSize="sm" color="subtle" mb={6}>
        Generate an API key to complete your Multiplayer setup. You can use the
        same API key to send your frontend data to Multiplayer (Step 1) and to
        send your backend data to Multiplayer (Step 2) or you can optionally
        generate four separate API keys. We recommend passing your API key(s) as
        an environment variable and not storing it in your repository.
      </Text>
      <GenerateOpenTelemetryToken
        allowMultiple={false}
        showOldTokens={false}
        props={{ mb: 2 }}
        onTokenGenerated={handleTokenGenerated}
        defaultKey="cli-key"
      />
    </>
  );
};

const CLIApps = () => {
  const { trackEvent } = useAnalytics();

  const handleTokenGenerated = () => {
    trackEvent(PostHogEvents.ONBOARDING_WIZARD_API_KEY_GENERATED, {
      actionSource: "Client Setup -> CLI Apps",
    });
  };

  return (
    <Box mx="auto">
      <Img src={CLIDiagram} alt="diagram" w="full" mb={4} />
      <Heading as="h2" size="lg" mb={4}>
        Multiplayer Session Recorder
      </Heading>
      <Text mb={4}>
        The Multiplayer <b>Session Recorder</b> captures full-stack session
        replays. Beyond debugging, it helps teams understand system behavior,
        investigate test failures, resolve support issues, and plan new features
        with context-rich annotations.
      </Text>
      <Box pb={8}>
        <Heading as="h3" size="md" mb={4}>
          Getting Started
        </Heading>
        <Heading as="h4" size="sm" mb={4}>
          Generate an API key
        </Heading>
        <GenerateCLIToken handleTokenGenerated={handleTokenGenerated} />

        <Heading as="h4" size="sm" mb={4}>
          Select your preferred language
        </Heading>
        <List spacing={2} pl={4} styleType="disc">
          <ListItem>
            <Link
              isExternal
              color="brand.500"
              href="https://github.com/multiplayer-app/multiplayer-session-recorder-javascript/tree/main/packages/session-recorder-node#set-up-cli-app"
            >
              Node.js
            </Link>
          </ListItem>
          <ListItem>
            <Link
              isExternal
              color="brand.500"
              href="https://github.com/multiplayer-app/multiplayer-session-recorder-python?tab=readme-ov-file#set-up-cli-app"
            >
              Python
            </Link>
          </ListItem>
          <ListItem>
            <Link
              isExternal
              color="brand.500"
              href="https://github.com/multiplayer-app/multiplayer-session-recorder-java?tab=readme-ov-file#set-up-cli-app"
            >
              Java
            </Link>
          </ListItem>
          <ListItem>
            <Link
              isExternal
              color="brand.500"
              href="https://github.com/multiplayer-app/multiplayer-session-recorder-dotnet?tab=readme-ov-file#set-up-cli-app"
            >
              .NET
            </Link>
          </ListItem>
          <ListItem>
            <Link
              isExternal
              color="brand.500"
              href="https://github.com/multiplayer-app/multiplayer-session-recorder-go?tab=readme-ov-file#set-up-cli-app"
            >
              Go
            </Link>
          </ListItem>
          <ListItem>
            <Link
              isExternal
              color="brand.500"
              href="https://github.com/multiplayer-app/multiplayer-session-recorder-ruby?tab=readme-ov-file#set-up-cli-app"
            >
              Ruby
            </Link>
          </ListItem>
          <ListItem>🚧 PHP</ListItem>
          <ListItem>🚧 Rust</ListItem>
          <ListItem>🚧 Swift</ListItem>
          <ListItem>🚧 Generic</ListItem>
        </List>
      </Box>
      <Text fontSize="sm" color="muted" mt={2} pb={8}>
        For languages and advanced usage, see the{" "}
        <Link
          isExternal
          color="brand.500"
          fontWeight="medium"
          href="https://www.multiplayer.app/docs/configure/configure-multiplayer#1c-cli-apps-libraries"
        >
          documentation for CLI apps libraries.
        </Link>
      </Text>
    </Box>
  );
};

export default CLIApps;
