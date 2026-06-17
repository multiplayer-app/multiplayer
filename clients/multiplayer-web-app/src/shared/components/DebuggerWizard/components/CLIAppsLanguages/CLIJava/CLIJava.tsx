import { Heading, Text } from "@chakra-ui/react";
import CodeSnippet from "shared/components/DebuggerWizard/components/CodeSnippet";

const installCode = `implementation 'app.multiplayer:session_recorder:1.0.0'`;

const importCode = `import app.multiplayer.session_recorder.SessionRecorder;
import app.multiplayer.session_recorder.type.SessionRecorderConfig;
import app.multiplayer.session_recorder.type.Session;
import app.multiplayer.session_recorder.type.SessionType;
import app.multiplayer.session_recorder.trace.SessionRecorderRandomIdGenerator;`;

const initCodeBlock = `// Configure and initialize
SessionRecorderConfig config = new SessionRecorderConfig();
config.setApiKey("{{YOUR_API_KEY}}");
config.setTraceIdGenerator(new SessionRecorderRandomIdGenerator());

// Initialize the SessionRecorder
SessionRecorder.init(config);`;

const sessionCode = `// Use it with static methods
Session session = new Session();
session.setName("My Session");

// Add tags if needed
session.addTag("environment", "production");
session.addTag("version", "v1.0.0");
session.addTag("feature", "session-recording");

// Add session attributes
session.addSessionAttribute("userId", "12345");
session.addSessionAttribute("environment", "production");
session.addSessionAttribute("version", "1.0.0");

// Add resource attributes
session.addResourceAttribute("service.name", "my-service");
session.addResourceAttribute("service.version", "1.0.0");
session.addResourceAttribute("deployment.environment", "production");

SessionRecorder.start(SessionType.PLAIN, session);`;

const exporterCode = `import io.opentelemetry.sdk.trace.export.SpanExporter;
import app.multiplayer.session_recorder.exporter.SessionRecorderOtlpHttpSpanExporter;

SpanExporter spanExporter = new SessionRecorderOtlpHttpSpanExporter(
    "{{MULTIPLAYER_OTLP_KEY}}",
    "https://otlp.multiplayer.app/v1/traces"
);`;

const samplerCode = `import io.opentelemetry.sdk.trace.samplers.Sampler;
import app.multiplayer.session_recorder.trace.samplers.SessionRecorderTraceIdRatioBasedSampler;

Sampler sampler = SessionRecorderTraceIdRatioBasedSampler.create(0.5);`;

const CLIJava = ({ children }) => {
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
        You can install the Multiplayer Session Recorder by adding it to your
        Gradle file:
      </Text>
      <CodeSnippet language="gradle" code={installCode} mb={4} />

      <Heading as="h4" size="sm" mb={4}>
        Basic Setup
      </Heading>
      <Text mb={4}>
        To initialize the Multiplayer Session Recorder in your Java application,
        follow the steps below.
      </Text>

      <Heading as="h5" size="xs" mb={4}>
        Import the Multiplayer Session Recorder
      </Heading>
      <CodeSnippet language="java" code={importCode} mb={4} />

      <Heading as="h4" size="sm" mb={4}>
        Initialization
      </Heading>
      <Text mb={4}>
        Use the following code to initialize the Multiplayer Session Recorder
        with your application details:
      </Text>
      <CodeSnippet language="java" code={initCodeBlock} mb={4} />
      <Text mb={4}>
        Replace the placeholders with your application's API key and other
        configuration details.
      </Text>

      <Heading as="h4" size="sm" mb={4}>
        Starting Sessions
      </Heading>
      <Text mb={4}>
        Use the following code to create and start recording sessions:
      </Text>
      <CodeSnippet language="java" code={sessionCode} mb={4} />

      <Heading as="h4" size="sm" mb={4}>
        Setting up OpenTelemetry Exporter
      </Heading>
      <Text mb={4}>
        To send OpenTelemetry data to Multiplayer, use the custom exporter:
      </Text>
      <CodeSnippet language="java" code={exporterCode} mb={4} />
      <Text mb={4}>
        This exporter will automatically handle authentication and send trace
        data to Multiplayer's collector for analysis.
      </Text>

      <Heading as="h4" size="sm" mb={4}>
        Trace Sampling
      </Heading>
      <Text mb={4}>Configure trace sampling using the built-in sampler:</Text>
      <CodeSnippet language="java" code={samplerCode} mb={4} />
      <Text mb={4}>
        The sampler allows you to control the percentage of traces that are
        recorded, helping to manage data volume and costs.
      </Text>
    </>
  );
};

export default CLIJava;
