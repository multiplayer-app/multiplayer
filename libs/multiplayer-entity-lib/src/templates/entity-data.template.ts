import { EntityData, EntityVisibility } from '@multiplayer/types'
import { docTemplate } from './blocknote.template'

export class EntityDataTemplate {
  public static empty = (name: string = '', mpVersion: number = -1, summaryToOverride?: Record<string, any>): EntityData => ({
    name,
    mpVersion,
    description: docTemplate(),
    information: {
      shortDescription: summaryToOverride?.shortDescription || '',
      visibility: summaryToOverride?.visibility || EntityVisibility.PRIVATE,
    },
  })
}