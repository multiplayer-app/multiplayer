import { Notebook } from '@multiplayer/types'

export const VARIABLE_REGEX = /({{[$a-zA-Z0-9-_\[\]\.]+}})/g
export const VARIABLE_MATCH_REGEX = /{{(.*?)}}/g

export const HttpMethodConfigs = {
  [Notebook.HttpMethodEnum.GET]: { color: '#38A169', bg: '#F0FFF4', label: 'GET' },
  [Notebook.HttpMethodEnum.POST]: { color: '#3182ce', bg: '#ebf8ff', label: 'POST' },
  [Notebook.HttpMethodEnum.PUT]: { color: '#D69E2E', bg: '#FFFFF0', label: 'PUT' },
  [Notebook.HttpMethodEnum.PATCH]: { color: '#DD6B20', bg: '#FFFAF0', label: 'PATCH' },
  [Notebook.HttpMethodEnum.DELETE]: { color: '#E53E3E', bg: '#FFF5F5', label: 'DELETE' },
  [Notebook.HttpMethodEnum.OPTIONS]: { color: '#319795', bg: '#E6FFFA', label: 'OPTIONS' },
  [Notebook.HttpMethodEnum.HEAD]: { color: '#718096', bg: '#ebf8ff', label: 'HEAD' },
  [Notebook.HttpMethodEnum.VIEW]: { color: '#718096', bg: '#ebf8ff', label: 'HEAD' },
  [Notebook.HttpMethodEnum.TRACE]: { color: '#718096', label: 'TRACE' },
}

export const TabConfigs = [
  {
    key: Notebook.AttributesTab.PARAMETERS,
    label: 'Parameters',
  },
  {
    key: Notebook.AttributesTab.BODY,
    label: 'Body',
  },
  {
    key: Notebook.AttributesTab.HEADERS,
    label: 'Headers',
  },
  {
    key: Notebook.AttributesTab.AUTHORIZATION,
    label: 'Authorization',
  },
  {
    key: Notebook.AttributesTab.VARIABLES,
    label: 'Variables',
    className: 'ml-auto',
  },
]

export const RawContentLanguagesMap = {
  [Notebook.RawContentLang.TEXT]: { label: 'Text', lang: Notebook.RawContentLang.TEXT },
  [Notebook.RawContentLang.JAVASCRIPT]: { label: 'JavaScript', lang: Notebook.RawContentLang.JAVASCRIPT },
  [Notebook.RawContentLang.JSON]: { label: 'JSON', lang: Notebook.RawContentLang.JSON },
  [Notebook.RawContentLang.HTML]: { label: 'HTML', lang: Notebook.RawContentLang.HTML },
  [Notebook.RawContentLang.XML]: { label: 'XML', lang: Notebook.RawContentLang.XML },
}

export const AuthorizationTypesMap = {
  [Notebook.AuthorizationType.NONE]: { label: 'No Auth', key: Notebook.AuthorizationType.NONE },
  [Notebook.AuthorizationType.BASIC]: { label: 'Basic Auth', key: Notebook.AuthorizationType.BASIC },
  [Notebook.AuthorizationType.API_KEY]: { label: 'API Key', key: Notebook.AuthorizationType.API_KEY },
  // [Notebook.AuthorizationType.JWT_BEARER]: { label: 'JWT Bearer', key: Notebook.AuthorizationType.JWT_BEARER },
  [Notebook.AuthorizationType.BEARER_TOKEN]: { label: 'Bearer Token', key: Notebook.AuthorizationType.BEARER_TOKEN },
}

export const AuthorizationAddToMap = {
  [Notebook.AuthorizationAddTo.HEADER]: { label: 'Header', key: Notebook.AuthorizationAddTo.HEADER },
  [Notebook.AuthorizationAddTo.QUERY]: { label: 'Query Param', key: Notebook.AuthorizationAddTo.QUERY },
}
