export interface DescriptionObject {
  content: string;
  type?: string;
  version?: any;
}

export type Description = DescriptionObject | string | null;

export interface UrlEncodedParameter {
  key: string;
  value?: string;
  disabled?: boolean;
  description?: Description;
}

export interface FormParameterText {
  key: string;
  value?: string;
  disabled?: boolean;
  type: 'text';
  contentType?: string;
  description?: Description;
}

export interface FormParameterFile {
  key: string;
  src?: string | null | any[];
  disabled?: boolean;
  type: 'file';
  contentType?: string;
  description?: Description;
}

export type FormParameter = FormParameterText | FormParameterFile;

export interface FileBody {
  src?: string | null;
  content?: string;
}

export interface RequestBody {
  mode?: 'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql';
  raw?: string;
  urlencoded?: UrlEncodedParameter[];
  formdata?: FormParameter[];
  file?: FileBody;
  graphql?: object;
  options?: Record<'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql', any>;
  disabled?: boolean;
}
export interface QueryParam {
  key?: string | null;
  value?: string | null;
  disabled?: boolean;
  description?: Description; // Assuming Description is defined elsewhere
}

export interface PathSegment {
  type: string;
  value: string;
}

export interface UrlObject {
  raw: string;
  protocol?: string;
  host?: string | string[];
  path?: string | (string | PathSegment)[];
  port?: string;
  query?: QueryParam[];
  hash?: string;
  variable?: Variable[];
}
export interface Variable {
  id?: string;
  key?: string;
  value?: any;
  type: 'string' | 'boolean' | 'any' | 'number';
  name?: string;
  description?: Description;
  system?: boolean;
  disabled?: boolean;
}
export interface Header {
  key: string;
  value: string;
  disabled?: boolean;
  description?: Description;
}
export interface AuthAttribute {
  key: string;
  value: string;
  type: string;
}

export interface Auth {
  type: 'apikey' | 'awsv4' | 'basic' | 'bearer' | 'digest' | 'edgegrid' | 'hawk' | 'noauth' | 'oauth1' | 'oauth2' | 'ntlm';
  noauth?: Record<string, unknown>;
  apikey?: AuthAttribute[];
  awsv4?: AuthAttribute[];
  basic?: AuthAttribute[];
  bearer?: AuthAttribute[];
  digest?: AuthAttribute[];
  edgegrid?: AuthAttribute[];
  hawk?: AuthAttribute[];
  ntlm?: AuthAttribute[];
  oauth1?: AuthAttribute[];
  oauth2?: AuthAttribute[];
}

export interface RequestObject {
  url: UrlObject | string
  auth?: Auth | null
  method?: string
  description?: Description
  header?: Header[] | string
  body?: RequestBody | null
}

export interface Info {
  name: string;
  _postman_id?: string;
  description?: Description;
  version?: any;
  schema: string;
}

export interface ItemGroup {
  name?: string;
  description?: Description;
  variable?: Variable[];
  item: (Item | ItemGroup)[];
  event?: Event[];
  auth?: Auth | null;
}

export interface Item {
  id?: string;
  name?: string;
  description?: Description;
  variable?: Variable[];
  event?: Event[];
  request: RequestObject | string;
  response: any;//todo
}
export interface Event {
  id?: string;
  listen: string;
  script?: any;
  disabled?: boolean;
}

export type ProtocolProfileBehavior = Record<string, any>

export interface Collection {
  info: Info;
  item: (Item | ItemGroup)[];
  event?: Event[];
  variable?: Variable[];
  auth?: Auth | null;
  protocolProfileBehavior?: ProtocolProfileBehavior;
}

export interface EnvironmentVariable {
  id: string
  key: string
  value: string
  type: string
}