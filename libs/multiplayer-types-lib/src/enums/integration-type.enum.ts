export enum IntegrationTypeEnum {
  GITLAB = 'GITLAB',
  GITHUB = 'GITHUB',
  BITBUCKET = 'BITBUCKET',
  ATLASSIAN = 'ATLASSIAN',
  LINEAR = 'LINEAR',
  API_KEY = 'API_KEY',
  OTEL = 'OTEL',
  SHARE_API_KEY = 'SHARE_API_KEY',
  SLACK = 'SLACK',

  /**
   * @deprecated
   */
  OTEL_FRONTEND = 'OTEL_FRONTEND',
}

export const IntegrationTypeConfigPropertyName: Record<IntegrationTypeEnum, string> = {
  [IntegrationTypeEnum.GITLAB]: 'gitlab',
  [IntegrationTypeEnum.GITHUB]: 'github',
  [IntegrationTypeEnum.BITBUCKET]: 'bitbucket',
  [IntegrationTypeEnum.ATLASSIAN]: 'atlassian',
  [IntegrationTypeEnum.LINEAR]: 'linear',
  [IntegrationTypeEnum.API_KEY]: 'apiKey',
  [IntegrationTypeEnum.OTEL]: 'otel',
  [IntegrationTypeEnum.OTEL_FRONTEND]: 'otel',
  [IntegrationTypeEnum.SHARE_API_KEY]: 'shareApiKey',
  [IntegrationTypeEnum.SLACK]: 'slack',
}
