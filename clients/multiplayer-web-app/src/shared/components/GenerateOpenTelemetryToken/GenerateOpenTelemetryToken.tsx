import { BoxProps } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";
import GenerateIntegrationKey from "shared/components/GenerateIntegrationKey";
import { IntegrationTypeEnum } from "@multiplayer/types";
import { useProjectSettingsPath } from "shared/hooks/useProjectSettingsPath";

const GenerateOpenTelemetryToken = ({
  searchable,
  allowMultiple,
  showOldTokens = true,
  defaultKey = "",
  props = {},
  onTokenGenerated,
}: {
  searchable?: boolean;
  allowMultiple?: boolean;
  showOldTokens?: boolean;
  defaultKey?: string;
  props?: BoxProps;
  onTokenGenerated?: (token: any) => void;
}) => {
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();
  const { segmentPath } = useProjectSettingsPath();

  return (
    <GenerateIntegrationKey
      props={props}
      searchable={searchable}
      defaultKey={defaultKey}
      allowMultiple={allowMultiple}
      showOldTokens={showOldTokens}
      integrationType={IntegrationTypeEnum.OTEL}
      onTokenGenerated={(res) => {
        trackEvent(PostHogEvents.SETUP_RADAR, {
          radarId: res?._id,
          name: res?.name,
        });
        onTokenGenerated?.(res);
      }}
      onShowAllKeys={() => {
        const to = segmentPath("otel-keys");
        if (to) navigate(to);
      }}
      onIntegrationDeleted={(radarId) =>
        trackEvent(PostHogEvents.REMOVE_RADAR_INTEGRATION, { radarId })
      }
    />
  );
};

export default GenerateOpenTelemetryToken;
