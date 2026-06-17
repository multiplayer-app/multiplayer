import {
  Box,
  Flex,
  Heading,
  Icon,
  Link,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { BackendSetupStep } from "shared/models/enums";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";
import GenerateOpenTelemetryToken from "shared/components/GenerateOpenTelemetryToken";
import { InfoIcon } from "@chakra-ui/icons";

type BackendStepContentProps = {
  value: BackendSetupStep;
};

const BackendStepContent = ({ value }: BackendStepContentProps) => {
  const { trackEvent } = useAnalytics();

  const handleTokenGenerated = () => {
    trackEvent(PostHogEvents.ONBOARDING_WIZARD_API_KEY_GENERATED, {
      actionSource: "Backend Setup -> Generate Multiplayer API Key",
    });
  };

  switch (value) {
    case BackendSetupStep.RootTraces:
      return (
        <Box>
          <Box mb={6}>
            <Heading as="h2" size="lg" mb={4}>
              Route traces and logs
            </Heading>
            <Text mb={4}>
              You have two primary options for routing your logs and traces to
              Multiplayer.
            </Text>
            <Flex alignItems="center" mb={2}>
              <Heading as="h4" size="sm">
                <Text as="span" position="relative" mr={6}>
                  Generate an API key{" "}
                  <Box
                    color="brand.500"
                    position="absolute"
                    top="0"
                    right="-16px"
                  >
                    <Tooltip
                      placement="top"
                      label="Generate an API key to send your backend data to Multiplayer. In case you already generated an API key in Step 1  you can re-use that, and skip this step. If you prefer to have two separate API keys, you can also generate one now for the backend data. We recommend passing your API key(s) as an environment variable and not storing it in your repository."
                    >
                      <Icon as={InfoIcon} boxSize="3" cursor="pointer" />
                    </Tooltip>
                  </Box>
                </Text>
              </Heading>
              <Box
                backgroundColor="bg.subtle"
                color="muted"
                px={1}
                border="0.5px solid bg.muted"
                borderRadius="6px"
                fontSize="12px"
                fontWeight={500}
                lineHeight="20px"
                boxShadow="0px -1px 1px 0px #7180961A inset, 0px 1px 1px 0px #FFFFFF80 inset"
              >
                Optional
              </Box>
            </Flex>
            <GenerateOpenTelemetryToken
              allowMultiple={false}
              showOldTokens={false}
              onTokenGenerated={handleTokenGenerated}
              defaultKey="backend-key"
            />
          </Box>
          <Stack gap={3}>
            <Link
              isExternal
              color="brand.500"
              fontWeight="medium"
              href="https://www.multiplayer.app/docs/configure/exporter"
              onClick={() =>
                trackEvent(PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED, {
                  actionSource: "backend step content direct exporter",
                  href: "https://www.multiplayer.app/docs/configure/exporter",
                })
              }
            >
              Multiplayer Exporter
            </Link>
            <Box
              p="4"
              borderRadius="16px"
              bg="bg.subtle"
              border="0.5px solid"
              borderColor="border.secondary"
            >
              <Text>
                Use it directly in your services to send all session recording
                data to Multiplayer, and optionally forward a sampled subset to
                your existing observability platform. Best for new apps or
                smaller setups: it’s quick to configure and requires no extra
                infrastructure.
              </Text>
            </Box>
            <Link
              isExternal
              color="brand.500"
              fontWeight="medium"
              href="https://github.com/multiplayer-app/multiplayer-otlp-collector"
              onClick={() =>
                trackEvent(PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED, {
                  actionSource: "backend step content collector docs",
                  href: "https://github.com/multiplayer-app/multiplayer-otlp-collector",
                })
              }
            >
              OpenTelemetry Collector
            </Link>
            <Box
              p="4"
              borderRadius="16px"
              bg="bg.subtle"
              border="0.5px solid"
              borderColor="border.secondary"
            >
              <Text>
                Send all telemetry to an OpenTelemetry Collector, which routes
                specific session recording data to Multiplayer and other
                telemetry to your existing observability tools. This option is
                recommended for larger or more complex systems, as it offers
                more control and scalability.
              </Text>
            </Box>
          </Stack>
        </Box>
      );
    case BackendSetupStep.CaptureRequestResponse:
      return (
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Capturing request/response and header content
          </Heading>
          <Text mb={3}>
            You have two primary options for capturing request/response and
            header content.
          </Text>
          <Stack gap={3} mb={3}>
            <Link
              isExternal
              color="brand.500"
              fontWeight="medium"
              href="https://www.multiplayer.app/docs/configure/in-service-code-capture"
              onClick={() =>
                trackEvent(PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED, {
                  actionSource: "backend step content inservice libs",
                  href: "https://www.multiplayer.app/docs/configure/in-service-code-capture",
                })
              }
            >
              Content-Capture Libraries
            </Link>
            <Box
              p="4"
              borderRadius="16px"
              bg="bg.subtle"
              border="0.5px solid"
              borderColor="border.secondary"
            >
              <Text>
                Use our libraries to collect and mask request / response content
                and headers directly within your service code. Ideal for new
                projects: simple setup, no extra components required.
              </Text>
            </Box>
            <Link
              isExternal
              color="brand.500"
              fontWeight="medium"
              href="https://github.com/multiplayer-app/multiplayer-proxy"
              onClick={() =>
                trackEvent(PostHogEvents.ONBOARDING_WIZARD_DOCS_LINK_CLICKED, {
                  actionSource: "backend step content proxy repo",
                  href: "https://github.com/multiplayer-app/multiplayer-proxy",
                })
              }
            >
              Multiplayer proxy
            </Link>
            <Box
              p="4"
              borderRadius="16px"
              bg="bg.subtle"
              border="0.5px solid"
              borderColor="border.secondary"
            >
              <Text>
                Run a Multiplayer Proxy to capture this data outside your
                services. Best for large-scale systems or languages that don’t
                support in-service hooks (like Java). Deploy it as an Ingress,
                Sidecar, or Embedded Proxy to fit your architecture.
              </Text>
            </Box>
          </Stack>
        </Box>
      );

    default:
      return null;
  }
};

export default BackendStepContent;
