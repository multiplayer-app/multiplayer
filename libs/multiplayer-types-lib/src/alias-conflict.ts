import { IEntity } from './entity'

export interface AliasConflict {
  alias: string
  duplicates: IEntity[]
}
