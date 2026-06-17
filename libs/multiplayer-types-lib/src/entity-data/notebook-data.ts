import { EntityData } from './entity-data'

export interface InlineElementMark {
  type: string;
  attrs?: Record<string, string>;
}

export interface InlineElement {
  type: string;
  text: string;
  marks?: InlineElementMark[]
}

export interface BlockElement {
  type: string;
  attrs?: Record<string, any>;
  content?: BlockElement[] | InlineElement[];
}

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

export interface EnvData {
  variables: AggregateVariable[]
  secrets: AggregateVariable[]
}
export interface Data extends EntityData {
  type: string;
  content?: BlockElement[];
  environments: Record<SourceEnv | string, EnvData>
}
