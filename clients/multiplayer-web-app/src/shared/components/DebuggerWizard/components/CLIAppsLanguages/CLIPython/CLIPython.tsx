import { Heading, Text } from "@chakra-ui/react";
import CodeSnippet from "shared/components/DebuggerWizard/components/CodeSnippet";

const installCode = `pip install multiplayer-session-recorder

# For Django support
pip install multiplayer-session-recorder[django]

# For Flask support
pip install multiplayer-session-recorder[flask]

# For both Django and Flask support
pip install multiplayer-session-recorder[all]`;

const importCode = `from multiplayer_session_recorder import (
    session_recorder,
    SessionType,
    SessionRecorderRandomIdGenerator
)
from .opentelemetry import id_generator

id_generator = SessionRecorderRandomIdGenerator()`;

const initCodeBlock = `session_recorder.init(
    apiKey = "{{YOUR_API_KEY}}",
    traceIdGenerator = id_generator,
    resourceAttributes = {
        "serviceName": "{{SERVICE_NAME}}",
        "version": "{{SERVICE_VERSION}}",
        "environment": "{{PLATFORM_ENV}}",
    }
)`;

const sessionCode = `# Start a session
await session_recorder.start(
    SessionType.PLAIN,
    {
        name: "This is test session",
        sessionAttributes: {
            accountId: "687e2c0d3ec8ef6053e9dc97",
            accountName: "Acme Corporation"
        }
    }
)

# Do something here

# Stop the session
await session_recorder.stop()`;

const exporterCode = `from multiplayer_session_recorder.exporter.http.trace_exporter import (
    OTLPSpanExporter as SessionRecorderOTLPSpanExporter
)

trace_exporter = SessionRecorderOTLPSpanExporter(
    endpoint = "https://otlp.multiplayer.app/v1/traces", # optional
    api_key = MULTIPLAYER_OTLP_KEY
)`;

const CLIPython = ({ children }) => {
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
        You can install the Multiplayer Session Recorder using pip:
      </Text>
      <CodeSnippet language="bash" code={installCode} mb={4} />

      <Heading as="h4" size="sm" mb={4}>
        Basic Setup
      </Heading>
      <Text mb={4}>
        To initialize the Multiplayer Session Recorder in your Python
        application, follow the steps below.
      </Text>

      <Heading as="h5" size="xs" mb={4}>
        Import the Multiplayer Session Recorder
      </Heading>
      <CodeSnippet language="python" code={importCode} mb={4} />

      <Heading as="h4" size="sm" mb={4}>
        Initialization
      </Heading>
      <Text mb={4}>
        Use the following code to initialize the Multiplayer Session Recorder
        with your application details:
      </Text>
      <CodeSnippet language="python" code={initCodeBlock} mb={4} />
      <Text mb={4}>
        Replace the placeholders with your application's version, name,
        environment, and API key.
      </Text>

      <Heading as="h4" size="sm" mb={4}>
        Starting and Stopping Sessions
      </Heading>
      <Text mb={4}>
        Use the following code to start and stop recording sessions:
      </Text>
      <CodeSnippet language="python" code={sessionCode} mb={4} />

      <Heading as="h4" size="sm" mb={4}>
        Setting up OpenTelemetry Exporter
      </Heading>
      <Text mb={4}>
        To send OpenTelemetry data to Multiplayer, use the custom exporter:
      </Text>
      <CodeSnippet language="python" code={exporterCode} mb={4} />
      <Text mb={4}>
        This exporter will automatically handle authentication and send trace
        data to Multiplayer's collector for analysis.
      </Text>
    </>
  );
};

export default CLIPython;
