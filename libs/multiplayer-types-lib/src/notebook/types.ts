import { Blocknote } from '../entity-data'
import {
  BodyType,
  JWTAlgorithm,
  HttpMethodEnum,
  RawContentLang,
  AuthorizationType,
  AuthorizationAddTo,
  FormDataPropertyType,
  NotebookInstrumentation,
} from './enums'
import { IDebugSession } from '../debug-session'
import { SpanContext } from '@opentelemetry/api'

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
// Dynamically set all values as strings
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
  // [AuthorizationType.JWT_BEARER]?: AuthorizationJWTBearer
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
export interface AggregateVariable extends Blocknote.AggregateVariable { }

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

export interface ApiBlockNode extends Blocknote.BlockElement {
  type: 'restApiBlock',
  attrs: RestApiBlockAttributes
}

export interface VariableError {
  type: 'missing' | 'empty'
  message: string
  variable: string
  path: string
}

export interface GenerateSpanParams {
  name: string;
  spanId?: string,
  parentSpanContext?: SpanContext;
  instrumentation?: NotebookInstrumentation;
}

export interface IMultiplayerDebugger {
  traceId: string;
  getSession: () => IDebugSession;
  startSession: () => Promise<void>
  stopSession: () => Promise<void>
  getDebugHeaders: (spanId?: string) => { key: string; value: string }[];
  exportSpans: (spanIds?: string[]) => void;
  generateSpan: (params: GenerateSpanParams) => string;
  addSpanEvent: (
    spanId: string,
    event: {
      name: string;
      attributes: Record<string, string | number | boolean>;
    }
  ) => void;
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

export interface SecretContext {
  workspaceId: string,
  projectId: string,
  entityId: string,
  // branchId: string, // Todo: uncomment if secrets should not be shared across branches
}

export interface SecretsManagerRecord {
  value: string
  key: string
  id: number
}
