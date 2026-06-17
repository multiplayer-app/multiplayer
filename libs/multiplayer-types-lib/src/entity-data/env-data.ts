import { EnvironmentType } from '../enums'
import { EntityData, EntityInformation } from './entity-data'
import { Blocknote } from '.'

export interface EnvironmentInformation extends EntityInformation {
  slug: string
  type: EnvironmentType
}

export interface EnvironmentData extends EntityData {
  mpVersion: number,
  information : EnvironmentInformation
  description: Blocknote.BlockElement
}


export const EnvironmentTypeToNameMap = {
  [EnvironmentType.EC2]: 'EC2',
  [EnvironmentType.DOCKER]: 'Docker',
  [EnvironmentType.K8S]: 'Kubernetes',
}
