import { EntityType, IntegrationTypeEnum } from "@multiplayer/types";
import {
  GithubIcon,
  GitlabIcon,
  BitbucketIcon,
  DirectoryIcon,
  FileIcon,
  SlackIcon,
} from "shared/icons";
import { GitObjectType, IntegrationType } from "shared/models/enums";
import { IconType } from "shared/models/types";

type IntegrationTypePartialEnum =
  | IntegrationTypeEnum.GITHUB
  | IntegrationTypeEnum.GITLAB
  | IntegrationTypeEnum.BITBUCKET
  | IntegrationTypeEnum.SLACK;

export interface IGitIntegrationConfig {
  label: string;
  description: string;
  icon: IconType;
  path: string;
  typeKey: IntegrationType;
  configUrl?: string;
}

export const integrationTypes: Record<
  IntegrationTypePartialEnum,
  IGitIntegrationConfig
> = {
  [IntegrationTypeEnum.GITHUB]: {
    label: "GitHub",
    icon: GithubIcon,
    description: "Manage your GitHub repositories",
    typeKey: IntegrationType.GITHUB,
    path: `/integrations/github-app/install`,
    configUrl: "https://github.com/settings/installations/{installationId}",
  },
  [IntegrationTypeEnum.GITLAB]: {
    label: "GitLab",
    icon: GitlabIcon,
    description: "Manage your GitLab repositories",
    typeKey: IntegrationType.GITLAB,
    path: `/integrations/${IntegrationType.GITLAB}/auth`,
    configUrl: "https://gitlab.com/-/user_settings/applications",
  },
  [IntegrationTypeEnum.BITBUCKET]: {
    label: "Bitbucket",
    icon: BitbucketIcon,
    description: "Manage your Bitbucket repositories",
    typeKey: IntegrationType.BITBUCKET,
    path: `/integrations/${IntegrationType.BITBUCKET}/auth`,
    configUrl: "https://bitbucket.org/account/settings/app-authorizations/",
  },
  [IntegrationTypeEnum.SLACK]: {
    label: "Slack",
    icon: SlackIcon,
    description: "Manage your Slack integration",
    typeKey: IntegrationType.SLACK,
    path: `/integrations/${IntegrationType.SLACK}/auth`,
    configUrl: "https://app.slack.com/apps-manage",
  },
};

export const GitRepositorySystemTags = ["Monorepo", "Polyrepo"];

export const sourceIconMap = {
  [GitObjectType.FILE]: FileIcon,
  [GitObjectType.DIRECTORY]: DirectoryIcon,
  [IntegrationTypeEnum.GITHUB]:
    integrationTypes[IntegrationTypeEnum.GITHUB].icon,
  [IntegrationTypeEnum.GITLAB]:
    integrationTypes[IntegrationTypeEnum.GITLAB].icon,
  [IntegrationTypeEnum.BITBUCKET]:
    integrationTypes[IntegrationTypeEnum.BITBUCKET].icon,
};

export const getSupportedEntitiesByGitObject = (
  type: GitObjectType | IntegrationTypeEnum
): Set<EntityType> => {
  switch (type) {
    case GitObjectType.FILE:
      return new Set([
        EntityType.API,
        EntityType.FILE,
        EntityType.PLATFORM_COMPONENT,
      ]);
    // case GitObjectType.DIRECTORY:
    //   return new Set([EntityType.PLATFORM_COMPONENT]);
    default:
      return new Set([EntityType.PLATFORM_COMPONENT]);
  }
};
