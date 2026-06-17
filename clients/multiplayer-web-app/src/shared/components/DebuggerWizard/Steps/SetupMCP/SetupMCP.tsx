import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Stack,
  Text,
  SimpleGrid,
  Icon,
  Code,
  Link,
  VStack,
  Divider,
} from "@chakra-ui/react";
import StepLayout from "shared/components/DebuggerWizard/components/StepLayout";
import {
  DebuggerWizardStepsEnum,
  IDEType,
  PostHogEvents,
} from "shared/models/enums";
import { MCP_TYPES } from "shared/configs/wizard.configs";
import { ReactComponent as Cursor } from "assets/images/wizard/cursor.svg";
import { ReactComponent as VisualStudio } from "assets/images/wizard/visualstudio.svg";
import { ReactComponent as Windsurf } from "assets/images/wizard/windsurf.svg";
import { ReactComponent as Claude } from "assets/images/wizard/claude.svg";
import { ReactComponent as Copilot } from "assets/images/wizard/copilot.svg";
import { ReactComponent as Generic } from "assets/images/wizard/generic.svg";
import { ReactComponent as Zed } from "assets/images/wizard/zed.svg";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import CopySyntax from "shared/components/DebuggerWizard/components/CopySyntax/CopySyntax";

const ICON_MAP = {
  Cursor,
  VisualStudio,
  Windsurf,
  Claude,
  Copilot,
  Generic,
  Zed,
};

const SetupMCP = ({ setActiveTab }) => {
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const { trackEvent } = useAnalytics();

  return (
    <Flex gap="10px" justifyContent="center" flex="1" h="full">
      <StepLayout
        title="Set up your IDE connection with MCP"
        setActiveTab={setActiveTab}
        isRecommendedStep={true}
        activeTab={DebuggerWizardStepsEnum.SetupMCP}
        description={
          <>
            Connect your development environment for AI-powered <br />
            debugging and development with full context.
          </>
        }
        isContentVisible={isContentVisible}
        children={
          <Stack gap={4} mb={16}>
            <Box mb={16}>
              <Text color="subtle" fontSize="14px" fontWeight={500} mb="20px">
                Select your AI IDE to see instructions:
              </Text>
              <SimpleGrid columns={[1, 2]} spacing={6}>
                {MCP_TYPES.map((type, index) => (
                  <MCPType
                    key={index}
                    isSelected={selectedMethod === type.value}
                    type={type}
                    onSelect={() => {
                      setSelectedMethod(type.value);
                      setIsContentVisible(true);
                      trackEvent(
                        PostHogEvents.ONBOARDING_WIZARD_MCP_IDE_SELECTED,
                        {
                          ide: type.name,
                        }
                      );
                    }}
                  />
                ))}
              </SimpleGrid>
            </Box>
          </Stack>
        }
      />
      {isContentVisible && (
        <Box
          width="50%"
          maxW="700px"
          overflow="auto"
          height="full"
          border="1px solid"
          borderColor="border.secondary"
          backgroundColor="bg.primary"
          borderRadius="16px"
          boxShadow="0px 1px 2px 0px #0000000D"
          px={8}
          py={8}
          key={selectedMethod}
        >
          <MCPInstructions selectedMethod={selectedMethod} />
          <Text fontSize="sm" color="muted" mt={4} pb={8}>
            For a detailed step-by-step implementation guides, please refer to
            our{" "}
            <Link
              isExternal
              color="brand.500"
              fontWeight="medium"
              href="https://www.multiplayer.app/docs/ai/mcp-server"
              onClick={() =>
                trackEvent(PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED, {
                  actionSource: "MCP rightpanel docs link",
                  href: "https://www.multiplayer.app/docs/ai/mcp-server",
                })
              }
            >
              comprehensive documentation.
            </Link>
          </Text>
        </Box>
      )}
    </Flex>
  );
};

const MCPInstructions = ({ selectedMethod }) => {
  const { trackEvent } = useAnalytics();
  const renderInstructions = () => {
    switch (selectedMethod) {
      case IDEType.Cursor:
        return (
          <VStack align="start" spacing={6}>
            <Box>
              <Text fontSize="18px" fontWeight="600" color="subtle" mb={3}>
                Cursor Setup
              </Text>
              <Text fontSize="14px" color="muted" mb={4}>
                <Link
                  href="https://docs.cursor.com/en/context/mcp"
                  color="brand.500"
                  isExternal
                  onClick={() =>
                    trackEvent(
                      PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED,
                      {
                        actionSource: "MCP cursor docs",
                        href: "https://docs.cursor.com/en/context/mcp",
                      }
                    )
                  }
                >
                  View Cursor MCP Documentation
                </Link>
              </Text>
            </Box>

            <Box>
              <Text fontSize="16px" fontWeight="500" color="subtle" mb={2}>
                Quick Setup (Recommended)
              </Text>
              <Button
                as={Link}
                href="https://cursor.com/en/install-mcp?name=Multiplayer&config=eyJ1cmwiOiJodHRwczovL2FwaS5tdWx0aXBsYXllci5hcHAvdjAvYXBpL3B1YmxpYy9tY3AifQ%3D%3D"
                isExternal
                colorScheme="blue"
                size="md"
                mb={4}
                onClick={() =>
                  trackEvent(
                    PostHogEvents.ONBOARDING_WIZARD_MCP_INSTALL_CLICKED,
                    {
                      ide: "Cursor",
                    }
                  )
                }
              >
                Install Multiplayer MCP
              </Button>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="16px" fontWeight="500" color="subtle" mb={2}>
                Project Configuration (Optional)
              </Text>
              <Text fontSize="14px" color="muted" mb={2}>
                Add <Code>.cursor/mcp.json</Code> in your project directory:
              </Text>
              <Box position="relative">
                <Code
                  p={3}
                  borderRadius="8px"
                  bg="bg.surface"
                  fontSize="12px"
                  display="block"
                  whiteSpace="pre-wrap"
                >
                  {`{
  "mcpServers": {
    "Multiplayer": {
      "url": "https://api.multiplayer.app/v0/api/public/mcp"
    }
  }
}`}
                </Code>
                <CopySyntax
                  value={`{
  "mcpServers": {
    "Multiplayer": {
      "url": "https://api.multiplayer.app/v0/api/public/mcp"
    }
  }
}`}
                />
              </Box>
            </Box>
          </VStack>
        );

      case IDEType.VisualStudio:
        return (
          <VStack align="start" spacing={6}>
            <Box>
              <Text fontSize="18px" fontWeight="600" color="subtle" mb={3}>
                Visual Studio Code Setup
              </Text>
              <Text fontSize="14px" color="muted" mb={4}>
                <Link
                  href="https://code.visualstudio.com/docs/copilot/chat/mcp-servers"
                  color="brand.500"
                  isExternal
                  onClick={() =>
                    trackEvent(
                      PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED,
                      {
                        actionSource: "MCP vscode docs",
                        href: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
                      }
                    )
                  }
                >
                  View VS Code MCP Documentation
                </Link>
              </Text>
            </Box>

            <Box>
              <Text fontSize="16px" fontWeight="500" color="subtle" mb={2}>
                Workspace Configuration
              </Text>
              <Text fontSize="14px" color="muted" mb={2}>
                Create <Code>.vscode/mcp.json</Code> in your workspace folder:
              </Text>
              <Box position="relative">
                <Code
                  p={3}
                  borderRadius="8px"
                  bg="bg.surface"
                  fontSize="12px"
                  display="block"
                  whiteSpace="pre-wrap"
                >
                  {`{
  "mcpServers": {
    "Multiplayer": {
      "url": "https://api.multiplayer.app/v0/api/public/mcp"
    }
  }
}`}
                </Code>
                <CopySyntax
                  value={`{
  "mcpServers": {
    "Multiplayer": {
      "url": "https://api.multiplayer.app/v0/api/public/mcp"
    }
  }
}`}
                />
              </Box>
            </Box>
          </VStack>
        );

      case IDEType.Claude:
        return (
          <VStack align="start" spacing={6}>
            <Box>
              <Text fontSize="18px" fontWeight="600" color="subtle" mb={3}>
                Claude Code Setup
              </Text>
              <Text fontSize="14px" color="muted" mb={4}>
                <Link
                  href="https://docs.anthropic.com/en/docs/claude-code/mcp"
                  color="brand.500"
                  isExternal
                  onClick={() =>
                    trackEvent(
                      PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED,
                      {
                        actionSource: "MCP claude docs",
                        href: "https://docs.anthropic.com/en/docs/claude-code/mcp",
                      }
                    )
                  }
                >
                  View Claude Code MCP Documentation
                </Link>
              </Text>
            </Box>

            <Box>
              <Text fontSize="16px" fontWeight="500" color="subtle" mb={2}>
                Add Multiplayer MCP Server
              </Text>
              <Text fontSize="14px" color="muted" mb={2}>
                Run this command in your terminal:
              </Text>
              <Box position="relative">
                <Code
                  p={3}
                  borderRadius="8px"
                  bg="bg.surface"
                  fontSize="12px"
                  display="block"
                >
                  claude mcp add --transport http Multiplayer -s project
                  https://api.multiplayer.app/v0/api/public/mcp
                </Code>
                <CopySyntax value="claude mcp add --transport http Multiplayer -s project https://api.multiplayer.app/v0/api/public/mcp" />
              </Box>
            </Box>

            <Box>
              <Text fontSize="16px" fontWeight="500" color="subtle" mb={2}>
                Verify Installation
              </Text>
              <Text fontSize="14px" color="muted" mb={2}>
                Check that the server was added:
              </Text>
              <Box position="relative">
                <Code
                  p={3}
                  borderRadius="8px"
                  bg="bg.surface"
                  fontSize="12px"
                  display="block"
                >
                  claude list
                </Code>
                <CopySyntax value="claude list" />
              </Box>
            </Box>

            <Box>
              <Text fontSize="16px" fontWeight="500" color="subtle" mb={2}>
                Authentication
              </Text>
              <Text fontSize="14px" color="muted" mb={2}>
                Within Claude Code, use the /mcp command to manage
                authentication:
              </Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="14px" color="muted">
                  1. Type <Code>/mcp</Code>
                </Text>
                <Text fontSize="14px" color="muted">
                  2. Select Multiplayer MCP server
                </Text>
                <Text fontSize="14px" color="muted">
                  3. Start authorization process
                </Text>
              </VStack>
            </Box>
          </VStack>
        );

      case IDEType.Copilot:
        return (
          <VStack align="start" spacing={6}>
            <Box>
              <Text fontSize="18px" fontWeight="600" color="subtle" mb={3}>
                Copilot Setup
              </Text>
              <Text fontSize="14px" color="muted" mb={4}>
                Copilot uses the same MCP configuration as VS Code.
              </Text>
            </Box>

            <Box>
              <Text fontSize="16px" fontWeight="500" color="subtle" mb={2}>
                Workspace Configuration
              </Text>
              <Text fontSize="14px" color="muted" mb={2}>
                Create <Code>.vscode/mcp.json</Code> in your workspace folder:
              </Text>
              <Box position="relative">
                <Code
                  p={3}
                  borderRadius="8px"
                  bg="bg.surface"
                  fontSize="12px"
                  display="block"
                  whiteSpace="pre-wrap"
                >
                  {`{
  "mcpServers": {
    "Multiplayer": {
      "url": "https://api.multiplayer.app/v0/api/public/mcp"
    }
  }
}`}
                </Code>
                <CopySyntax
                  value={`{
  "mcpServers": {
    "Multiplayer": {
      "url": "https://api.multiplayer.app/v0/api/public/mcp"
    }
  }
}`}
                />
              </Box>
            </Box>
          </VStack>
        );

      case IDEType.Windsurf:
        return (
          <VStack align="start" spacing={6}>
            <Box>
              <Text fontSize="18px" fontWeight="600" color="subtle" mb={3}>
                Windsurf Setup
              </Text>
              <Text fontSize="14px" color="muted" mb={4}>
                <Link
                  href="https://docs.windsurf.com/windsurf/cascade/mcp"
                  color="brand.500"
                  isExternal
                  onClick={() =>
                    trackEvent(
                      PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED,
                      {
                        actionSource: "MCP windsurf docs",
                        href: "https://docs.windsurf.com/windsurf/cascade/mcp",
                      }
                    )
                  }
                >
                  View Windsurf MCP Documentation
                </Link>
              </Text>
            </Box>

            <Box>
              <Text fontSize="16px" fontWeight="500" color="subtle" mb={2}>
                Configuration Steps
              </Text>
              <VStack align="start" spacing={2}>
                <Text fontSize="14px" color="muted">
                  1. Go to Settings → Windsurf Settings → Cascade → Manage Mcp
                </Text>
                <Text fontSize="14px" color="muted">
                  2. Click "View Raw config"
                </Text>
                <Text fontSize="14px" color="muted">
                  3. Add the following to the config:
                </Text>
              </VStack>
            </Box>

            <Box position="relative">
              <Code
                p={3}
                borderRadius="8px"
                bg="bg.surface"
                fontSize="12px"
                display="block"
                whiteSpace="pre-wrap"
              >
                {`{
  "mcpServers": {
    "Multiplayer": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.multiplayer.app/v0/api/public/mcp"
      ]
    }
  }
}`}
              </Code>
              <CopySyntax
                value={`{
  "mcpServers": {
    "Multiplayer": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.multiplayer.app/v0/api/public/mcp"
      ]
    }
  }
}`}
              />
            </Box>
          </VStack>
        );

      case IDEType.Zed:
        return (
          <VStack align="start" spacing={6}>
            <Box>
              <Text fontSize="18px" fontWeight="600" color="subtle" mb={3}>
                Zed Configuration
              </Text>
              <Text fontSize="14px" color="muted" mb={4}>
                <Link
                  href="https://www.multiplayer.app/docs/ai/zed"
                  color="brand.500"
                  isExternal
                  onClick={() =>
                    trackEvent(
                      PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED,
                      {
                        actionSource: "Zed docs",
                        href: "https://www.multiplayer.app/docs/ai/zed",
                      }
                    )
                  }
                >
                  View Zed Documentation
                </Link>
              </Text>
            </Box>

            <Box>
              <Text fontSize="16px" fontWeight="500" color="subtle" mb={2}>
                Configuration Steps
              </Text>
              <VStack align="start" spacing={2}>
                <Text fontSize="14px" color="muted">
                  1. Open Zed settings
                </Text>
                <Text fontSize="14px" color="muted">
                  2. Press CMD
                </Text>
                <Text fontSize="14px" color="muted">
                  3. Add the following:
                </Text>
              </VStack>
            </Box>

            <Box position="relative">
              <Code
                p={3}
                borderRadius="8px"
                bg="bg.surface"
                fontSize="12px"
                display="block"
                whiteSpace="pre-wrap"
              >
                {`{
     context_servers: {
         multiplayer: {
           command: {
             path: "npx",
             args: [
               "-y",
               "mcp-remote",
               "https://api.multiplayer.app/v0/api/public/mcp",
             ],
             env: {},
           },
           settings: {},
         },
       },
     }`}
              </Code>
              <CopySyntax
                value={`{
     context_servers: {
         multiplayer: {
           command: {
             path: "npx",
             args: [
               "-y",
               "mcp-remote",
               "https://api.multiplayer.app/v0/api/public/mcp",
             ],
             env: {},
           },
           settings: {},
         },
       },
     }`}
              />
            </Box>
          </VStack>
        );

      case IDEType.Generic:
        return (
          <VStack align="start" spacing={6}>
            <Box>
              <Text fontSize="18px" fontWeight="600" color="subtle" mb={3}>
                Manual Setup
              </Text>
              <Text fontSize="14px" color="muted" mb={4}>
                Choose the configuration method that works best for your editor.
              </Text>
            </Box>

            <Box>
              <Text fontSize="16px" fontWeight="500" color="subtle" mb={2}>
                OAuth Configuration (Recommended)
              </Text>
              <Text fontSize="14px" color="muted" mb={2}>
                For clients that support OAuth, use this streamlined
                configuration:
              </Text>
              <Box position="relative">
                <Code
                  p={3}
                  borderRadius="8px"
                  bg="bg.surface"
                  fontSize="12px"
                  display="block"
                  whiteSpace="pre-wrap"
                >
                  {`{
  "mcpServers": {
    "Multiplayer": {
      "url": "https://api.multiplayer.app/v0/api/public/mcp"
    }
  }
}`}
                </Code>
                <CopySyntax
                  value={`{
  "mcpServers": {
    "Multiplayer": {
      "url": "https://api.multiplayer.app/v0/api/public/mcp"
    }
  }
}`}
                />
              </Box>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="16px" fontWeight="500" color="subtle" mb={2}>
                Remote MCP Configuration
              </Text>
              <Text fontSize="14px" color="muted" mb={2}>
                For clients that don't support OAuth, use this configuration:
              </Text>
              <Box position="relative">
                <Code
                  p={3}
                  borderRadius="8px"
                  bg="bg.surface"
                  fontSize="12px"
                  display="block"
                  whiteSpace="pre-wrap"
                >
                  {`{
  "mcpServers": {
    "Multiplayer": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://api.multiplayer.app/v0/api/public/mcp"]
    }
  }
}`}
                </Code>
                <CopySyntax
                  value={`{
  "mcpServers": {
    "Multiplayer": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://api.multiplayer.app/v0/api/public/mcp"]
    }
  }
}`}
                />
              </Box>
            </Box>
          </VStack>
        );

      default:
        return (
          <Box>
            <Text fontSize="16px" color="muted">
              Select an IDE to view setup instructions
            </Text>
          </Box>
        );
    }
  };

  return <Box>{renderInstructions()}</Box>;
};

const MCPType = ({ type, isSelected, onSelect }) => {
  const { name, iconName } = type;
  const IconComponent = ICON_MAP[iconName];
  return (
    <Box
      p={4}
      borderRadius="16px"
      onClick={onSelect}
      cursor="pointer"
      bg={isSelected ? "rgba(73, 59, 255, 0.05)" : "bg.subtle"}
      border={isSelected ? "2px solid" : "1px solid"}
      borderColor={isSelected ? "brand.500" : "border.secondary"}
      _hover={
        !isSelected && {
          border: "1px solid",
          borderColor: "border.tertiary",
        }
      }
    >
      <Flex justifyContent="space-between">
        <Flex direction="column" align="start" gap={4}>
          <Icon as={IconComponent} width={12} height={12} borderRadius="4px" />
          <Text fontWeight="semibold" fontSize="lg">
            {name}
          </Text>
        </Flex>
        <Box
          width={6}
          height={6}
          borderRadius="50%"
          border="1px solid"
          flexShrink={0}
          backgroundColor={isSelected ? "brand.500" : "bg.primary"}
          borderColor={isSelected ? "brand.500" : "muted"}
          position="relative"
        >
          {isSelected && (
            <Box
              position="absolute"
              width={3}
              height={3}
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              backgroundColor="bg.primary"
              borderRadius="50%"
            />
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default SetupMCP;
