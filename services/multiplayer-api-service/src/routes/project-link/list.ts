import type { Request, Response, NextFunction } from 'express'
import {
  IProjectLink,
  IntegrationTypeEnum,
  ProjectLinkObjectType,
  EntityType,
} from '@multiplayer/types'
import { ProjectLinkLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const projectId = req.params.projectId as string
    const archived = Boolean(req.query.archived)
    const gitRefRepositoryId = req.query.gitRefRepositoryId as string
    const gitRefType = req.query.gitRefType as IntegrationTypeEnum
    const gitRefBranch = req.query.gitRefBranch as string
    const gitRefPath = req.query.gitRefPath as string
    const targetObjectType = req.query.targetObjectType as (ProjectLinkObjectType | ProjectLinkObjectType[])
    const sourceObjectType = req.query.sourceObjectType as (ProjectLinkObjectType | ProjectLinkObjectType[])
    const targetObjectId = req.query.targetObjectId as string
    const sourceObjectId = req.query.sourceObjectId as string
    const targetEntityType = req.query.targetEntityType as (EntityType | EntityType[])
    const sourceEntityType = req.query.sourceEntityType as (EntityType | EntityType[])
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const sortDirection = Number(req.query.sortDirection)
    const sortKey = req.query.sortKey as string
    const sourceObjectEntityTypesToExclude = req.query.sourceObjectEntityTypesToExclude as (EntityType | EntityType[])

    const cursor: any = {}
    if (!gitRefPath && !gitRefRepositoryId) {
      cursor.skip = skip
      cursor.limit = limit
    }

    const filter: Partial<Omit<IProjectLink, 'targetObjectType' | 'sourceObjectType' | 'targetEntityType' | 'sourceEntityType'>> & {
      archived?: boolean
      sourceGitRefRepositoryId?: string
      sourceGitRefBranch?: string
      sourceGitRefPath?: string
      sourceGitRefType?: IntegrationTypeEnum
      targetObjectType?: (ProjectLinkObjectType | ProjectLinkObjectType[])
      sourceObjectType?: (ProjectLinkObjectType | ProjectLinkObjectType[])
      targetObjectId?: string
      sourceObjectId?: string
      targetEntityType?: EntityType | EntityType[]
      sourceEntityType?: EntityType | EntityType[]
      sourceObjectEntityTypesToExclude?: EntityType | EntityType[]
    } = {
      archived,
      sourceGitRefRepositoryId: gitRefRepositoryId,
      sourceGitRefBranch: gitRefBranch,
      sourceGitRefPath: gitRefPath,
      sourceGitRefType: gitRefType,
      projectBranch: projectBranchId,
      project: projectId,
      targetObjectType,
      sourceObjectType,
      targetObjectId,
      sourceObjectId,
      targetEntityType,
      sourceEntityType,
      ...(sourceObjectEntityTypesToExclude ? { sourceObjectEntityTypesToExclude: Array.isArray(sourceObjectEntityTypesToExclude) ? sourceObjectEntityTypesToExclude : [sourceObjectEntityTypesToExclude] } : {}),
    }

    const projectLinks = await ProjectLinkLib.getProjectLinkState(
      projectBranchId,
      filter,
      cursor,
      {
        sortKey,
        sortDirection,
      },
    )

    return res.status(200).json(projectLinks)
  } catch (err) {
    return next(err)
  }
}
