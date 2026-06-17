import { Blocknote } from '.'
import { EntityVisibility } from './entity-visibility'

export interface EntityInformation {
  visibility: EntityVisibility,
  shortDescription: string
}


export interface EntityData {
  mpVersion: number
  name: string
  information: EntityInformation
  description: Blocknote.BlockElement
}
