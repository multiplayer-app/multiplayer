import {
  Box,
  Heading,
  Text,
  Link,
  Tooltip,
  Icon,
  TabList,
  Tab,
  TabPanels,
  Tabs,
  TabPanel,
} from "@chakra-ui/react";
import CodeSnippet from "shared/components/DebuggerWizard/components/CodeSnippet";
import GenerateOpenTelemetryToken from "shared/components/GenerateOpenTelemetryToken";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";
import { InfoIcon } from "@chakra-ui/icons";

const npmInstall = "npm install @multiplayer-app/session-recorder-browser";
const yarnInstall = "yarn add @multiplayer-app/session-recorder-browser";

const vueSetup = `// main.js
import { createApp } from 'vue'
import App from './App.vue'
import SessionRecorder from '@multiplayer-app/session-recorder-browser'

// Initialize Session Recorder before creating the Vue app
SessionRecorder.init({
  application: 'my-vue-app',
  version: '1.0.0',
  environment: 'production',
  apiKey: 'YOUR_MULTIPLAYER_API_KEY',
  // Configure CORS URLs if your backend is on a different domain
  propagateTraceHeaderCorsUrls: [new RegExp('https://api.example.com', 'i')]
})

const app = createApp(App)
app.mount('#app')`;

const angularSetup = `// main.ts
import SessionRecorder from '@multiplayer-app/session-recorder-browser'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { AppModule } from './app/app.module'

// Initialize Session Recorder before bootstrapping Angular
SessionRecorder.init({
  application: 'my-angular-app',
  version: '1.0.0',
  environment: 'production',
  apiKey: 'YOUR_MULTIPLAYER_API_KEY',
  // Configure CORS URLs if your backend is on a different domain
  propagateTraceHeaderCorsUrls: [new RegExp('https://api.example.com', 'i')]
})

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err))`;

const reactSetup = `// src/main.tsx or src/index.tsx app root
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import SessionRecorder, { SessionRecorderProvider } from '@multiplayer-app/session-recorder-react'

const sessionRecorderConfig = {
  version: '1.0.0',
  environment: 'production',
  application: 'my-react-app',
  apiKey: 'YOUR_MULTIPLAYER_API_KEY',
  // IMPORTANT: in order to propagate OTLP headers to a backend
  // domain(s) with a different origin, add backend domain(s) below.
  // e.g. if you serve your website from www.example.com
  // and your backend domain is at api.example.com set value as shown below:
  // format: string|RegExp|Array
  propagateTraceHeaderCorsUrls: [new RegExp('https://api.example.com', 'i')]
}

// Initialize the session recorder before mounting (Recommended)
SessionRecorder.init(sessionRecorderConfig)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SessionRecorderProvider>
    <App />
  </SessionRecorderProvider>
)`;

const jsSetup = `
import SessionRecorder from '@multiplayer-app/session-recorder-browser'

SessionRecorder.init({
  application: 'my-web-app',
  version: '1.0.0',
  environment: 'production',
  apiKey: 'MULTIPLAYER_API_KEY' // note: replace with your Multiplayer API key
  // IMPORTANT: in order to propagate OTLP headers to a backend
  // domain(s) with a different origin, add backend domain(s) below.
  // e.g. if you serve your website from www.example.com
  // and your backend domain is at api.example.com set value as shown below:
  // format: string|RegExp|Array
  propagateTraceHeaderCorsUrls: [new RegExp('https://api.example.com', 'i')],
})


// Use session attributes to attach user context to recordings.
// The provided \`userName\` and \`userId\` will be visible in the Multiplayer
// sessions list and in the session details (shown as the reporter),
// making it easier to identify who reported or recorded the session.

SessionRecorder.setSessionAttributes({
  userId: '12345',
  userName: 'John Doe'
})
`;

const reactNativeSetup = `
import React from 'react';
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

const reactNativeExpoApps = `
import React from 'react';
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
}
`;

const ClientLibrary = () => {
  const { trackEvent } = useAnalytics();

  const handleTokenGenerated = () => {
    trackEvent(PostHogEvents.ONBOARDING_WIZARD_API_KEY_GENERATED, {
      actionSource: "Client Setup -> Javascript Client Library",
    });
  };

  return (
    <Box pb={8}>
      <Heading as="h2" size="lg" mb={4}>
        JavaScript Client Library
      </Heading>
      <Text mb={4}>
        This is a lightweight, framework-agnostic, configurable client you can
        embed directly in your web app. For language specific libraries and all
        advanced options, check our{" "}
        <Link
          href="https://www.multiplayer.app/docs/configure/configure-multiplayer"
          isExternal
          color="brand.500"
          fontWeight="medium"
        >
          documentation
        </Link>
        .
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
        showOldTokens={false}
        props={{ mb: 2 }}
        onTokenGenerated={handleTokenGenerated}
        defaultKey="browser-key"
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
        Quick start
      </Heading>
      <Tabs>
        <TabList>
          <Tab whiteSpace="nowrap" key="js">
            Javascript
          </Tab>
          <Tab whiteSpace="nowrap" key="reactNextJs">
            React & Next.js
          </Tab>
          <Tab whiteSpace="nowrap" key="vue">
            Vue.js
          </Tab>
          <Tab whiteSpace="nowrap" key="angular">
            Angular
          </Tab>
          <Tab whiteSpace="nowrap" key="reactNative">
            React Native
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Text>
              Use the following code below to initialize and run the session
              recorder.
            </Text>
            <CodeSnippet language="bash" code={jsSetup} />
          </TabPanel>
          <TabPanel>
            <Text>
              1. Recommended: Call SessionRecorder.init(options) before you
              mount your React app to avoid losing any data.
            </Text>
            <Text>
              {" "}
              2. Wrap your application with the SessionRecorderProvider.{" "}
            </Text>
            <Text>
              3. Start or stop sessions using the widget or the provided hooks.
            </Text>
            <CodeSnippet language="bash" code={reactSetup} />
          </TabPanel>
          <TabPanel>
            <Text>
              The simplest way to integrate the session recorder is to
              initialize it in your main.js file:
            </Text>
            <CodeSnippet language="bash" code={vueSetup} />
          </TabPanel>
          <TabPanel>
            <Text>
              The simplest way to integrate the session recorder is to
              initialize it in your main.ts file:
            </Text>
            <CodeSnippet language="bash" code={angularSetup} />
          </TabPanel>
          <TabPanel>
            <Text>For Basic React Native Apps (App.tsx)</Text>
            <CodeSnippet language="bash" code={reactNativeSetup} mb={3} />
            <Text>For Expo Apps (_layout.tsx)</Text>
            <CodeSnippet language="bash" code={reactNativeExpoApps} mb={3} />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Text fontSize="sm" color="muted" mt={2}>
        For more options and advanced usage, see the{" "}
        <Link
          href="https://github.com/multiplayer-app/multiplayer-session-recorder-javascript/tree/main/packages/session-recorder-browser#advanced-config"
          isExternal
          color="brand.500"
          fontWeight="medium"
        >
          Advanced config in the JavaScript Client library readme
        </Link>
        .
      </Text>
    </Box>
  );
};

export default ClientLibrary;
