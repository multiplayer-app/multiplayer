import { OpenAPIV3_1 } from 'openapi-types'
import { ApiType } from '@multiplayer/types'
import { EntityDataTemplate } from './entity-data.template'

export const CURRENT_VERSION = 1

export const contentsTemplate = (summaryToOverride?: Record<string, any>): OpenAPIV3_1.Document => ({
  openapi: summaryToOverride?.openapiVersion || '3.1.0',
  info: {
    version: '0.0.1',
    title: 'OpenAPI Document',
  },
  servers: [],
  tags: [],
  paths: summaryToOverride?.paths || {},
  components: summaryToOverride?.components || { schemas: {} },
})

export const empty = (name = '', summaryToOverride?: Record<string, any>) => ({
  ...EntityDataTemplate.empty(name, CURRENT_VERSION, summaryToOverride),
  metadata: summaryToOverride?.metadata || { version: '3.0.0', provider: ApiType.OPENAPI },
  contents: summaryToOverride?.contents || JSON.stringify(contentsTemplate(summaryToOverride)),
  extension: summaryToOverride?.extension || 'json',
})
