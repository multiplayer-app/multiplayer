export enum EntityType {
  PLATFORM = 'platform',
  PLATFORM_COMPONENT = 'platform_component',
  API = 'api',
  SCHEMA = 'schema',
  SKETCH = 'sketch', // do not use!!!!!!! this type is left only for backward compatibility
  FILE = 'file',
  NOTEBOOK = 'notebook',
  ENVIRONMENT = 'environment',
  EXCALIDRAW = 'excalidraw',
  VARIABLE_GROUP = 'variable_group',
}

export enum RequestEntityType {
  MERGE_REQUEST = 'MERGE_REQUEST'
}
export enum NotesType {
  SESSION = 'SESSION'
}

export const EntityTypeNames = {
  [EntityType.PLATFORM]: 'platform',
  [EntityType.PLATFORM_COMPONENT]: 'platform_component',
  [EntityType.API]: 'api',
  [EntityType.SCHEMA]: 'schema',
  [EntityType.SKETCH]: 'sketch',
  [EntityType.FILE]: 'file',
  [EntityType.NOTEBOOK]: 'notebook',
  [EntityType.ENVIRONMENT]: 'environment',
  [EntityType.EXCALIDRAW]: 'sketch',
  [EntityType.VARIABLE_GROUP]: 'variable_group',
}
