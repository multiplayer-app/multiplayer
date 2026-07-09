export namespace Blocknote {
  export enum SourceEnv {
    PREDEFINED = 'predefined',
    REQUEST = 'request',
    GLOBAL = 'global',
    BLOCK = 'block',
  }

  export interface AggregateVariable {
    key: string
    value: any
    source: SourceEnv | string
    description?: string
    getValue?: () => any
  }
}

export namespace Notebook {
  export const RUNNABLE_API_BLOCK_NAME = 'restApiBlock'
  export const RUNNABLE_CODE_BLOCK_NAME = 'runnableCodeBlock'

  export enum BodyType {
    NONE = 'none',
    FORM_DATA = 'form-data',
    URL_ENCODED = 'x-www-form-urlencoded',
    RAW = 'raw',
    BINARY = 'binary',
  }

  export enum AuthorizationType {
    NONE = 'none',
    BASIC = 'basic',
    BEARER_TOKEN = 'bearer_token',
    API_KEY = 'api_key',
  }

  export enum JWTAlgorithm {
    HS256 = 'HS256',
    HS384 = 'HS384',
    HS512 = 'HS512',
    RS256 = 'RS256',
    RS384 = 'RS384',
    RS512 = 'RS512',
    PS256 = 'PS256',
    PS384 = 'PS384',
    PS512 = 'PS512',
    ES256 = 'ES256',
    ES384 = 'ES384',
  }

  export enum AuthorizationAddTo {
    HEADER = 'header',
    QUERY = 'query',
  }

  export enum FormDataPropertyType {
    FILE = 'file',
    TEXT = 'text',
  }

  export enum RawContentLang {
    TEXT = 'plaintext',
    JAVASCRIPT = 'javascript',
    JSON = 'json',
    HTML = 'html',
    XML = 'xml',
  }

  export enum HttpMethodEnum {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
    OPTIONS = 'OPTIONS',
    HEAD = 'HEAD',
    VIEW = 'VIEW',
    TRACE = 'TRACE',
  }

  export enum AttributesTab {
    PARAMETERS = 'parameters',
    BODY = 'body',
    HEADERS = 'headers',
    AUTHORIZATION = 'authorization',
    VARIABLES = 'Variables',
  }

  export enum NotebookInstrumentation {
    HTTP = '@multiplayer/notebook-http',
    CODE = '@multiplayer/notebook-code',
    OTHER = '@multiplayer/notebook',
  }

  export interface RestApiBlockAttributes {
    _id: string
    _runnable: boolean
    _globalName: string
    url: string
    body: ApiBlockBody
    method: HttpMethodEnum
    authorization: Authorization
    headers: ApiBlockHeaders
    variables: ApiBlockVariables
    parameters: ApiBlockParameters
  }

  export type RestApiBlockAttributesStringified = {
    [K in keyof RestApiBlockAttributes]: string
  }

  export type ApiBlockHeaders = Array<{ key: string; value: string; description?: string }>
  export type ApiBlockVariables = Array<{ key: string; value: string; description?: string }>
  export type ApiBlockParameters = Array<{ key: string; value: string; description?: string }>

  export interface ApiBlockBody {
    type: BodyType
    [BodyType.RAW]?: RawContentType
    [BodyType.BINARY]?: BinaryContentType
    [BodyType.FORM_DATA]?: FormDataContentType
    [BodyType.URL_ENCODED]?: UrlEncodedContentType
  }

  export interface Authorization {
    type: AuthorizationType
    [AuthorizationType.BASIC]?: AuthorizationBasic
    [AuthorizationType.API_KEY]?: AuthorizationAPIKey
    [AuthorizationType.BEARER_TOKEN]?: AuthorizationBearerToken
  }

  export type RawContentType = { value: string; type: RawContentLang }
  export type BinaryContentType = FileType | null
  export type FormDataContentItem = {
    key: string
    value: string | FileType
    type: FormDataPropertyType
    description: string
  }
  export type FormDataContentType = Array<FormDataContentItem>
  export type UrlEncodedContentItem = { key: string; value: string; description: string }
  export type UrlEncodedContentType = Array<UrlEncodedContentItem>

  export interface AuthorizationBasic {
    username: string
    password: string
  }
  export interface AuthorizationBearerToken {
    token: string
  }
  export interface AuthorizationJWTBearer {
    algorithm: JWTAlgorithm
    secret: string
    secretEncoded: boolean
    payload: any
    requestHeaderPrefix: string
    jwtHeaders: any
    addTo: AuthorizationAddTo
  }
  export interface AuthorizationAPIKey {
    key: string
    value: string
    addTo: AuthorizationAddTo
  }

  export type FileType = {
    name: string
    type: string
    size: number
    base64: string
  }

  export interface AggregateVariable extends Blocknote.AggregateVariable {}

  export interface GlobalState {
    variables: Record<string, any>
    handlers: Record<string, any>
  }

  export interface AttributeComponentProps {
    readOnly: boolean
    variables?: AggregateVariable[]
    attributes: RestApiBlockAttributes
    updateAttributes: (arg: Partial<RestApiBlockAttributes>) => void
  }

  export interface VariableError {
    type: 'missing' | 'empty'
    message: string
    variable: string
    path: string
  }

  export interface GenerateSpanParams {
    name: string
    spanId?: string
    parentSpanContext?: any
    instrumentation?: NotebookInstrumentation
  }

  export interface IMultiplayerDebugger {
    traceId: string
    getSession: () => any
    startSession: () => Promise<void>
    stopSession: () => Promise<void>
    getDebugHeaders: (spanId?: string) => { key: string; value: string }[]
    exportSpans: (spanIds?: string[]) => void
    generateSpan: (params: GenerateSpanParams) => string
    addSpanEvent: (
      spanId: string,
      event: {
        name: string
        attributes: Record<string, string | number | boolean>
      },
    ) => void
    addSpanAttrs: (spanId: string, attrs: Record<string, string>) => void
  }

  export interface ISecretsManager {
    storeSecret(name: string, value: string | number | boolean): Promise<number>
    getAllSecrets(): Promise<SecretsManagerRecord[]>
    getSecretByName(name: string): Promise<SecretsManagerRecord | undefined>
    getSecretById(id: number): Promise<SecretsManagerRecord | undefined>
    deleteSecretByName(name: string): Promise<void>
    deleteSecretById(id: number): Promise<void>
  }

  export interface SecretsManagerRecord {
    value: string
    key: string
    id: number
  }
}
