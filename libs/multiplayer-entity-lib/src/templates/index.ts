import { EntityType } from '@multiplayer/types'
import * as SketchTemplates from './sketch.template'
import * as PlatformTemplates from './platform.template'
import * as BlocknoteTemplates from './blocknote.template'
import * as PlatformComponentTemplates from './platform-component.template'
import * as EnvironmentTemplates from './environment.template'
import * as SourceTemplates from './source.template'
import * as ApiTemplates from './api.template'
import * as ExcalidrawTemplates from './excalidraw.template'
import * as VariableGroupTemplates from './variable-group.template'
import * as SessionNotesTemplates from './session-note.template'

const Templates = {
  [EntityType.SKETCH]: SketchTemplates,
  [EntityType.PLATFORM]: PlatformTemplates,
  [EntityType.NOTEBOOK]: BlocknoteTemplates,
  [EntityType.PLATFORM_COMPONENT]: PlatformComponentTemplates,
  [EntityType.ENVIRONMENT]: EnvironmentTemplates,
  [EntityType.FILE]: SourceTemplates,
  [EntityType.API]: ApiTemplates,
  [EntityType.EXCALIDRAW]: ExcalidrawTemplates,
  [EntityType.VARIABLE_GROUP]: VariableGroupTemplates,
}

export {
  Templates,
  SketchTemplates,
  PlatformTemplates,
  BlocknoteTemplates,
  PlatformComponentTemplates,
  EnvironmentTemplates,
  SourceTemplates,
  ApiTemplates,
  ExcalidrawTemplates,
  VariableGroupTemplates,
  SessionNotesTemplates,
}
