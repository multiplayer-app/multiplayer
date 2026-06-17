import { Heading, Text } from "@chakra-ui/react";
import CodeSnippet from "shared/components/DebuggerWizard/components/CodeSnippet";

const installCode = `dotnet add package SessionRecorder`;

const importCode = `using SessionRecorder;
using SessionRecorder.Types;`;

const initCodeBlock = `// Initialize the session recorder
var config = new SessionRecorderConfig
{
    ApiKey = "your-api-key",
    TraceIdGenerator = new SessionRecorderIdGenerator(),
    ResourceAttributes = new Dictionary<string, object>
    {
        { "service.name", "my-service" },
        { "service.version", "1.0.0" }
    }
};

// Initialize the session recorder
SessionRecorder.Init(config);`;

const sessionCode = `// Start a session
var session = new Session
{
    Name = "My Debug Session",
    SessionAttributes = new Dictionary<string, object>
    {
        { "user.id", "12345" },
        { "environment", "production" }
    },
    ResourceAttributes = new Dictionary<string, object>
    {
        { "host.name", "server-01" }
    }
};

await SessionRecorder.Start(SessionType.PLAIN, session);

// Stop the session
var stopSession = new Session
{
    SessionAttributes = new Dictionary<string, object>
    {
        { "completion.status", "success" },
        { "duration.minutes", 15 }
    }
};

await SessionRecorder.Stop(stopSession);`;

const middlewareCode = `// Add HTTP capture middleware
app.UseMiddleware<SessionRecorderHttpCaptureMiddleware>();`;

const CLIDotNet = ({ children }) => {
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
        You can install the Multiplayer Session Recorder using the .NET CLI:
      </Text>
      <CodeSnippet language="bash" code={installCode} mb={4} />

      <Heading as="h4" size="sm" mb={4}>
        Basic Setup
      </Heading>
      <Text mb={4}>
        To initialize the Multiplayer Session Recorder in your .NET application,
        follow the steps below.
      </Text>

      <Heading as="h5" size="xs" mb={4}>
        Import the Multiplayer Session Recorder
      </Heading>
      <CodeSnippet language="csharp" code={importCode} mb={4} />

      <Heading as="h4" size="sm" mb={4}>
        Initialization
      </Heading>
      <Text mb={4}>
        Use the following code to initialize the Multiplayer Session Recorder
        with your application details:
      </Text>
      <CodeSnippet language="csharp" code={initCodeBlock} mb={4} />
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
      <CodeSnippet language="csharp" code={sessionCode} mb={4} />

      <Heading as="h4" size="sm" mb={4}>
        HTTP Capture Middleware
      </Heading>
      <Text mb={4}>
        To capture HTTP requests and responses, add the middleware to your
        application:
      </Text>
      <CodeSnippet language="csharp" code={middlewareCode} mb={4} />
      <Text mb={4}>
        This middleware will automatically capture HTTP requests and responses
        for debugging and analysis.
      </Text>
    </>
  );
};

export default CLIDotNet;
