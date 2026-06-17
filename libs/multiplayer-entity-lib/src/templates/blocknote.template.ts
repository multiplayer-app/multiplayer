import { Blocknote, Notebook } from '@multiplayer/types'
import { v4 as uuidv4 } from 'uuid'
import { EntityDataTemplate } from './entity-data.template'

export const CURRENT_VERSION = 3

export const docTemplate = () => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
    },
  ],
})

export const empty = (name = '', summaryToOverride?: Record<string, any>): Blocknote.Data => ({
  ...EntityDataTemplate.empty(name, CURRENT_VERSION, summaryToOverride),
  ...docTemplate(),
  environments: {
    [Blocknote.SourceEnv.GLOBAL]: {
      variables: [],
      secrets: [],
    },
  },
})


export const emptyApiBlock = (globalName = ''): Notebook.RestApiBlockAttributes => ({
  _id: uuidv4(),
  _runnable: true,
  _globalName: globalName,

  url: getEmptyAttribute('url'),
  body: getEmptyAttribute('body'),
  method: getEmptyAttribute('method'),
  headers: [getEmptyAttribute('headers')],
  variables: [getEmptyAttribute('variables')],
  parameters: [getEmptyAttribute('parameters')],
  authorization: getEmptyAttribute('authorization'),
})



export function getEmptyBodyProperty(type: Notebook.BodyType): any {
  switch (type) {
    case Notebook.BodyType.BINARY:
      return null
    case Notebook.BodyType.URL_ENCODED:
      return { key: '', value: '', description: '' }
    case Notebook.BodyType.RAW:
      return { value: '', type: Notebook.RawContentLang.TEXT }
    case Notebook.BodyType.FORM_DATA:
      return { key: '', value: '', description: '', type: Notebook.FormDataPropertyType.TEXT }
    default:
      return ''
  }
}

export function getEmptyAuthorization(
  type: Notebook.AuthorizationType,
): Notebook.AuthorizationBasic | Notebook.AuthorizationBearerToken | Notebook.AuthorizationJWTBearer | Notebook.AuthorizationAPIKey | null {
  switch (type) {
    case Notebook.AuthorizationType.BASIC:
      return { username: '', password: '' }
    case Notebook.AuthorizationType.API_KEY:
      return { key: '', value: '', addTo: Notebook.AuthorizationAddTo.HEADER }
    case Notebook.AuthorizationType.BEARER_TOKEN:
      return { token: '' }
    // case Notebook.AuthorizationType.JWT_BEARER:
    //   return {
    //     secret: '',
    //     payload: '{}',
    //     jwtHeaders: '{}',
    //     secretEncoded: false,
    //     requestHeaderPrefix: 'Bearer',
    //     algorithm: JWTAlgorithm.HS256,
    //     addTo: Notebook.AuthorizationAddTo.HEADER,
    //   }
    default:
      return null
  }
}

export function getEmptyAttribute(key: keyof Notebook.RestApiBlockAttributes): any {
  switch (key) {
    case 'url':
      return ''
    case 'method':
      return Notebook.HttpMethodEnum.GET
    case 'parameters':
      return { key: '', value: '', description: '' }
    case 'headers':
      return { key: '', value: '', description: '' }
    case 'variables':
      return { key: '', value: '', description: '' }
    case 'body':
      return {
        type: Notebook.BodyType.NONE,
        [Notebook.BodyType.RAW]: getEmptyBodyProperty(Notebook.BodyType.RAW),
        [Notebook.BodyType.BINARY]: getEmptyBodyProperty(Notebook.BodyType.BINARY),
        [Notebook.BodyType.FORM_DATA]: [getEmptyBodyProperty(Notebook.BodyType.FORM_DATA)],
        [Notebook.BodyType.URL_ENCODED]: [getEmptyBodyProperty(Notebook.BodyType.URL_ENCODED)],
      }
    case 'authorization':
      return {
        type: Notebook.AuthorizationType.NONE,
        [Notebook.AuthorizationType.BASIC]: getEmptyAuthorization(Notebook.AuthorizationType.BASIC),
        [Notebook.AuthorizationType.API_KEY]: getEmptyAuthorization(Notebook.AuthorizationType.API_KEY),
        [Notebook.AuthorizationType.BEARER_TOKEN]: getEmptyAuthorization(Notebook.AuthorizationType.BEARER_TOKEN),
        // [Notebook.AuthorizationType.JWT_BEARER]: getEmptyAuthorization(Notebook.AuthorizationType.JWT_BEARER),
      }
    default:
      return ''
  }
}