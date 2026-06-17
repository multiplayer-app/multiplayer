import { Heading, Text } from "@chakra-ui/react";
import CodeSnippet from "shared/components/DebuggerWizard/components/CodeSnippet";

const installCode = `npm install @multiplayer-app/session-recorder-node @multiplayer-app/session-recorder-opentelemetry
# or
yarn add @multiplayer-app/session-recorder-node @multiplayer-app/session-recorder-opentelemetry`;

const importCode = `import SessionRecorder from '@multiplayer-app/session-recorder-node'
// Multiplayer trace id generator which is used during opentelemetry initialization
import { idGenerator } from './opentelemetry'`;

const initCodeBlock = `SessionRecorder.init(
  '{YOUR_API_KEY}',
  idGenerator,
  {
    resourceAttributes: {
      serviceName: '{YOUR_APPLICATION_NAME}',
      version: '{YOUR_APPLICATION_VERSION}',
      environment: '{YOUR_APPLICATION_ENVIRONMENT}',
    }
  }
)`;

const CLINodeJS = ({ children }) => {
  return (
    <>
      <Heading as="h3" size="md" mb={4}>
        Getting Started
      </Heading>
      {children}
      <Heading as="h4" size="sm" mb={4}>
        Installation
      </Heading>
      <Text mb={4}>
        You can install the Multiplayer Session Recorder using npm or yarn:
      </Text>
      <CodeSnippet language="bash" code={installCode} mb={4} />

      <Heading as="h4" size="sm" mb={4}>
        Basic Setup
      </Heading>
      <Text mb={4}>
        To initialize the Multiplayer Session Recorder in your application,
        follow the steps below.
      </Text>
      <Heading as="h5" size="xs" mb={4}>
        Import the Multiplayer Session Recorder
      </Heading>
      <CodeSnippet language="bash" code={importCode} />

      {/* Initialization Section */}
      <Heading as="h4" size="sm" mb={4}>
        Initialization
      </Heading>
      <Text mb={4}>
        Use the following code to initialize the Multiplayer Session Recorder
        with your application details:
      </Text>
      <CodeSnippet language="javascript" code={initCodeBlock} mb={4} />
      <Text mb={4}>
        Replace the placeholders with your application's version, name,
        environment, and API key.
      </Text>
    </>
  );
};

export default CLINodeJS;
