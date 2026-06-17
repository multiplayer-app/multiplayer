import { AliasConflict } from '../alias-conflict'
import { IProjectBranchConflicts } from '../project-branch'

export interface GetConflictsResponse {
  aliases: AliasConflict[],
  commits: IProjectBranchConflicts[]
}
