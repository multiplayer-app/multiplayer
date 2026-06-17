import { ComponentType } from './platform-data'
import { EntityData, EntityInformation } from './entity-data'
import { EntityVisibility } from './entity-visibility'
import { Blocknote } from '.'

export const EntityVisibilityToNameMap = {
  [EntityVisibility.PRIVATE]: 'Private',
  [EntityVisibility.PUBLIC]: 'Public',
}

export enum PlatformComponentOwner {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

export const PlatformComponentOwnerToNameMap = {
  [PlatformComponentOwner.INTERNAL]: 'Internal',
  [PlatformComponentOwner.EXTERNAL]: 'External',
}

export enum PlatformComponentColorEnum {
  GRAY = 'gray',
  RED = 'red',
  ORANGE = 'orange',
  YELLOW = 'yellow',
  GREEN = 'green',
  TEAL = 'teal',
  BLUE = 'blue',
  CYAN = 'cyan',
  PURPLE = 'purple',
  PINK = 'pink',
}

// [fill, stroke, selected]
export const PlatformComponentColors = {
  [PlatformComponentColorEnum.GRAY]: ['#EDF2F7', '#CBD5E0', '#718096'] ,
  [PlatformComponentColorEnum.RED]: ['#FED7D7', '#FC8181', '#E53E3E'] ,
  [PlatformComponentColorEnum.ORANGE]: ['#FEEBC8', '#F6AD55', '#DD6B20'] ,
  [PlatformComponentColorEnum.YELLOW]: ['#FEFCBF', '#F6E05E', '#D69E2E'] ,
  [PlatformComponentColorEnum.GREEN]: ['#C6F6D5', '#68D391', '#38A169'] ,
  [PlatformComponentColorEnum.TEAL]: ['#B2F5EA', '#4FD1C5', '#319795'] ,
  [PlatformComponentColorEnum.BLUE]: ['#bee3f8', '#63b3ed', '#3182ce'] ,
  [PlatformComponentColorEnum.CYAN]: ['#C4F1F9', '#76E4F7', '#00B5D8'] ,
  [PlatformComponentColorEnum.PURPLE]: ['#E9D8FD', '#B794F4', '#805AD5'] ,
  [PlatformComponentColorEnum.PINK]: ['#FED7E2', '#F687B3', '#D53F8C'] ,
}

export interface PlatformComponentInformation extends EntityInformation {
  type: ComponentType
  owner: PlatformComponentOwner
  slug: string
  iconUrl?: string
  color?: PlatformComponentColorEnum
}

export interface EnvironmentVariable {
  id: string
  name: string
  required: boolean
  defaultValue?: string
  description?: string
  environments: {
    [env: string]: string
  }
}
export interface PlatformComponent extends EntityData {
  information: PlatformComponentInformation
  description: Blocknote.BlockElement
  environmentVariables: {
    [variableName: string]: EnvironmentVariable
  }
}
