import { IProjectBranch, ProjectBranchStatus, ProjectBranchType } from '../project-branch'

export interface ProjectBranchCreateRequest {
  name: string
  parentProjectBranch: string
  status?: ProjectBranchStatus
  type: ProjectBranchType
  archived?: boolean
  default?: boolean
}

export type ProjectBranchCreateResponse = IProjectBranch
