import { Types } from 'mongoose'

export interface ProjectStateTestContext {
  userId: Types.ObjectId
  workspaceUserId: Types.ObjectId
  workspaceId: Types.ObjectId
  projectId: Types.ObjectId
  defaultProjectBranchId: Types.ObjectId
  initialCommitId: Types.ObjectId
}
