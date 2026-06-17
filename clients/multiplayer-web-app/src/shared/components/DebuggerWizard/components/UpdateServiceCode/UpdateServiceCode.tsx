import { useState } from "react";
import { Box, Heading, Highlight, Text } from "@chakra-ui/react";
import LanguageDropdown from "shared/components/DebuggerWizard/components/LanguageDropdown";
import { WizzardLanguagesEnum } from "shared/models/enums";
import CodeSnippet from "shared/components/DebuggerWizard/components/CodeSnippet";

const installMiddleware = `npm install body-parser morgan
# or
yarn add body-parser morgan`;

const middlewareToService = `import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';

const app = express();

// Capture raw request bodies
app.use(bodyParser.json());
app.use(morgan('combined')); // Logs requests

// Example route
app.post('/api/data', (req, res) => {
  console.log('Request Body:', req.body);
  res.status(200).send({ status: 'success' });
});`;

const linkToMultiplayer = `import { traceContext } from '@multiplayer-app/session-recorder-node';

app.use(traceContext());`;

const UpdateServiceCode = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(
    WizzardLanguagesEnum.NodeJs
  );

  return (
    <Box pb={4}>
      <Text mb={4}>Readme goes here..</Text>
      <LanguageDropdown
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
      />

      <Heading as="h4" size="sm" mb={4}>
        Update Service Code
      </Heading>
      <Text mb={4}>
        <Highlight query="Pro tip:" styles={{ fontWeight: "semibold", mr: 1 }}>
          Add request/response libraries directly to your service code for
          detailed content capture. To capture detailed request and response
          payloads, integrate the following into your backend service code.
        </Highlight>
        <Text>
          1. Install Required Middleware or Packages For Express (Node.js) apps:
        </Text>
      </Text>
      <CodeSnippet language="bash" code={installMiddleware} />

      <Text mb={4}>
        <Highlight query="Pro tip:" styles={{ fontWeight: "semibold", mr: 1 }}>
          2. Add Middleware to Your Service
        </Highlight>
      </Text>
      <CodeSnippet language="bash" code={middlewareToService} />

      <Text mb={4}>
        <Highlight query="Pro tip:" styles={{ fontWeight: "semibold", mr: 1 }}>
          3. Link with Multiplayer Session Recorder Add tracing or session
        </Highlight>
        <Text>context to your middleware (optional):</Text>
      </Text>
      <CodeSnippet language="bash" code={linkToMultiplayer} />
    </Box>
  );
};

export default UpdateServiceCode;
