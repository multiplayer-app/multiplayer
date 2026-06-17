import { OpenAPIV3 } from 'openapi-types'
import { EntityCommitChangeType } from '@multiplayer/types'

export type PathOperationType = OpenAPIV3.OperationObject;
export type ComponentsObjectType = OpenAPIV3.ComponentsObject;
export type TagObjectType = OpenAPIV3.TagObject;
export type ComponentType =
  | OpenAPIV3.ReferenceObject
  | OpenAPIV3.SchemaObject
  | OpenAPIV3.ResponseObject
  | OpenAPIV3.ParameterObject
  | OpenAPIV3.ExampleObject
  | OpenAPIV3.RequestBodyObject
  | OpenAPIV3.HeaderObject
  | OpenAPIV3.SecuritySchemeObject
  | OpenAPIV3.LinkObject
  | OpenAPIV3.CallbackObject;

export interface IParameterObject extends OpenAPIV3.ParameterObject {
  changeType: EntityCommitChangeType;
}

export interface ICollection extends OpenAPIV3.TagObject {
  key: string;
  paths: Record<string, any>;
  changeType: EntityCommitChangeType;
  isDeleted?: boolean;
  isDefault?: boolean;
}
export enum ViewNodeType {
  TAG = 'tag',
  PATH = 'path',
  COMPONENT = 'component',
}
