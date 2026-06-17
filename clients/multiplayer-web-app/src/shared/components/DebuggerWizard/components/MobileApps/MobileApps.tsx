import {
  Box,
  Heading,
  Text,
  Link,
  Tooltip,
  Icon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import GenerateOpenTelemetryToken from "shared/components/GenerateOpenTelemetryToken";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";
import { InfoIcon } from "@chakra-ui/icons";
import CodeSnippet from "shared/components/DebuggerWizard/components/CodeSnippet";

const npmInstall = "npm install @multiplayer-app/session-recorder-react-native";
const yarnInstall = "yarn add @multiplayer-app/session-recorder-react-native";

const minimalSetup1 = `import React from 'react';
import {
  SessionRecorderProvider,
  SessionRecorder,
} from '@multiplayer-app/session-recorder-react-native';

// Initialize with minimal required options
SessionRecorder.init({
  application: 'my-react-native-app',
  version: '1.0.0',
  environment: 'production',
  apiKey: 'YOUR_MULTIPLAYER_API_KEY',
});

export default function App() {
  return (
    <SessionRecorderProvider>{/* Your app content */}</SessionRecorderProvider>
  );
}`;

const minimalSetup2 = `import React from 'react';
import { Stack } from 'expo-router';
import {
  SessionRecorderProvider,
  SessionRecorder,
} from '@multiplayer-app/session-recorder-react-native';

// Initialize with minimal required options
SessionRecorder.init({
  application: 'my-expo-app',
  version: '1.0.0',
  environment: 'production',
  apiKey: 'YOUR_MULTIPLAYER_API_KEY',
});

export default function RootLayout() {
  return (
    <SessionRecorderProvider>
      <Stack />
    </SessionRecorderProvider>
  );
}`;

const MobileApps = () => {
  const { trackEvent } = useAnalytics();

  const handleTokenGenerated = () => {
    trackEvent(PostHogEvents.ONBOARDING_WIZARD_API_KEY_GENERATED, {
      actionSource: "Client Setup -> Mobile Apps",
    });
  };

  return (
    <Box pb={8}>
      <Heading as="h2" size="lg" mb={4}>
        React Native Client Library
      </Heading>
      <Text mb={4}>
        This library provides comprehensive session recording capabilities for
        React Native applications, and it includes full support for both bare
        React Native and Expo applications.
      </Text>

      <Heading as="h4" size="sm" mb={4}>
        <Text as="span" position="relative">
          Generate an API key{" "}
          <Box color="brand.500" position="absolute" top="0" right="-16px">
            <Tooltip
              placement="top"
              label="Generate an API key to complete your Multiplayer setup. You can use the same API key to send your frontend data to Multiplayer (Step 1) and to send your backend data to Multiplayer (Step 2) or you can optionally generate separate API keys. We recommend passing your API key(s) as an environment variable and not storing it in your repository."
            >
              <Icon as={InfoIcon} boxSize="3" cursor="pointer" />
            </Tooltip>
          </Box>
        </Text>
      </Heading>
      <GenerateOpenTelemetryToken
        allowMultiple={false}
        onTokenGenerated={handleTokenGenerated}
        showOldTokens={false}
        props={{ mb: 2 }}
        defaultKey="mobile-key"
      />

      <Heading as="h4" size="sm" mb={4}>
        Installation
      </Heading>
      <Tabs>
        <TabList>
          <Tab key="npm">NPM</Tab>
          <Tab key="yarn">YARN</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <CodeSnippet language="bash" code={npmInstall} width="full" />
          </TabPanel>
          <TabPanel>
            <CodeSnippet language="bash" code={yarnInstall} width="full" />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Heading as="h4" size="sm" mb={4}>
        Quick start (Minimal Setup)
      </Heading>
      <Text mb={4}>For Basic React Native Apps (App.tsx)</Text>
      <CodeSnippet language="bash" code={minimalSetup1} width="full" mb={3} />
      <Text mb={4}>For Expo Apps (_layout.tsx)</Text>
      <CodeSnippet language="bash" code={minimalSetup2} width="full" />

      <Text fontSize="sm" color="muted" mt={2}>
        For more options and advanced usage, see the{" "}
        <Link
          href="https://github.com/multiplayer-app/multiplayer-session-recorder-javascript/blob/main/packages/session-recorder-react-native/README.md"
          isExternal
          color="brand.500"
          fontWeight="medium"
        >
          Multiplayer Session Recorder for React Native readme
        </Link>
        .
      </Text>
    </Box>
  );
};

export default MobileApps;
