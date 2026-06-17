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
  // JWT_BEARER = 'jwt_bearer', // Can not use jsonwebtoken sign operation in a browser
  API_KEY = 'api_key',
}

export enum AuthSchemaType {
  BEARER ='bearer',
  BASIC='basic',
  API_KEY='apiKey',
  COOKIE='cookie',
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
