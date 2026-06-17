import { Icon, IconProps } from "@chakra-ui/react";
import { EntityType, IntegrationTypeEnum } from "@multiplayer/types";
import {
  FlowIcon,
  RadarIcon,
  GithubIcon,
  GitlabIcon,
  DebuggerIcon,
  CopilotFlatIcon,
  EntityApiIcon,
  BitbucketIcon,
  EntityCodeIcon,
  EntitySchemaIcon,
  EntitySketchIcon,
  EntityPlatformIcon,
  EntityDocumentIcon,
  EntityComponentIcon,
  EntityEnvironmentIcon,
  EntityVariableGroupIcon,
  UserEntityIcon,
} from "shared/icons";
import { ProjectSourceType } from "shared/models/enums";

interface EntityIconProps extends IconProps {
  name:
    | EntityType
    | IntegrationTypeEnum
    | ProjectSourceType
    | "session"
    | "issue"
    | "user"
    | "flow"
    | "agent";
}

const EntityIcon = ({ name, color = "muted", ...rest }: EntityIconProps) => {
  switch (name) {
    case EntityType.PLATFORM:
      return <Icon color={color} as={EntityPlatformIcon} {...rest} />;
    case EntityType.ENVIRONMENT:
      return <Icon color={color} as={EntityEnvironmentIcon} {...rest} />;
    case EntityType.PLATFORM_COMPONENT:
      return <Icon color={color} as={EntityComponentIcon} {...rest} />;
    case EntityType.API:
      return <Icon color={color} as={EntityApiIcon} {...rest} />;
    case EntityType.SCHEMA:
      return <Icon color={color} as={EntitySchemaIcon} {...rest} />;
    case EntityType.SKETCH:
    case EntityType.EXCALIDRAW:
      return <Icon color={color} as={EntitySketchIcon} {...rest} />;
    case EntityType.FILE:
      return <Icon color={color} as={EntityCodeIcon} {...rest} />;
    case EntityType.NOTEBOOK:
      return <Icon color={color} as={EntityDocumentIcon} {...rest} />;
    case EntityType.VARIABLE_GROUP:
      return <Icon color={color} as={EntityVariableGroupIcon} {...rest} />;
    case IntegrationTypeEnum.GITHUB:
      return <Icon color={color} as={GithubIcon} {...rest} />;
    case IntegrationTypeEnum.GITLAB:
      return <Icon color={color} as={GitlabIcon} {...rest} />;
    case IntegrationTypeEnum.BITBUCKET:
      return <Icon color={color} as={BitbucketIcon} {...rest} />;
    case ProjectSourceType.DEBUGGER:
    case "session":
      return <Icon color={color} as={DebuggerIcon} {...rest} />;
    case ProjectSourceType.AGENTS:
    case "agent":
      return <Icon color={color} as={CopilotFlatIcon} {...rest} />;
    case "issue":
    case "radar":
    case IntegrationTypeEnum.OTEL:
      return <Icon color={color} as={RadarIcon} {...rest} />;
    case "user":
      return <Icon color={color} as={UserEntityIcon} {...rest} />;
    case "flow":
      return <Icon color={color} as={FlowIcon} {...rest} />;
    default:
      return <Icon color={color} as={EntityPlatformIcon} {...rest} />;
  }
};

export const EntityFileIcon = ({
  name,
  color = "muted",
  ...rest
}: EntityIconProps) => {
  switch (name) {
    case EntityType.PLATFORM:
      return <Icon color={color} as={EntityPlatformIcon} {...rest} />;
    case EntityType.PLATFORM_COMPONENT:
      return <Icon color={color} as={EntityComponentIcon} {...rest} />;
    case EntityType.API:
      return <Icon color={color} as={EntityApiIcon} {...rest} />;
    case EntityType.SCHEMA:
      return <Icon color={color} as={EntitySchemaIcon} {...rest} />;
    case EntityType.SKETCH:
    case EntityType.EXCALIDRAW:
      return <Icon color={color} as={EntitySketchIcon} {...rest} />;
    case EntityType.FILE:
      return <Icon color={color} as={EntityCodeIcon} {...rest} />;
    case EntityType.NOTEBOOK:
      return <Icon color={color} as={EntityDocumentIcon} {...rest} />;
    default:
      return <Icon color={color} as={EntityPlatformIcon} {...rest} />;
  }
};

export default EntityIcon;
