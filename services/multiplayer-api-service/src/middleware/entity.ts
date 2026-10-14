import type { Request, Response, NextFunction } from 'express'
import {
  EntityModel,
  IEntityDocument,
} from '@multiplayer/models'
import {
  ErrorMessage, ErrorMessageWithParams,
} from '@multiplayer/types'
import {
  InvalidArgumentError,
  NotFoundError,
} from 'restify-errors'
import { getDuplicatesWithinBranch } from '../lib/entity-commit.lib'
import { slugifyString } from '@multiplayer/util-shared'

export const hasUniqueAliases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const entityId = req.params.entityId as string

    const entityType = req.body?.type
    const key = req.body?.key || req.body?.entityName || req.body?.name
    const keyAliases = req.body?.keyAliases || []

    const keys = [
      ...(key ? [key] : []),
      ...keyAliases,
    ].map(keyAlias => slugifyString(keyAlias))


    if (
      key
      && keyAliases?.length
      && keyAliases?.includes(key)
    ) {
      throw new InvalidArgumentError('Aliases should be unique. Entity name cannot be included')
    }

    if (!keys?.length) {
      return next()
    }
    let entity

    if (entityId) {
      entity = await EntityModel.findEntityInProjectAndWorkspace(
        entityId,
        projectId,
        workspaceId,
      )

      if (!entity) {
        throw new NotFoundError(ErrorMessage.ENTITY_NOT_FOUND)
      }
    }

    const foundDuplicate = await getDuplicatesWithinBranch({
      keys,
      projectBranchId,
      entityId,
      type: entity?.type || entityType,
    })
    if (foundDuplicate) {
      throw new InvalidArgumentError(ErrorMessageWithParams.NO_ALIAS_DUPLICATES(
        foundDuplicate.key,
        foundDuplicate.entity.key,
        foundDuplicate.entity.type,
      ))
    }

    return next()
  } catch (err) {
    return next(err)
  }
}

export const attachEntity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectBranch } = req
    const entityId = req.params.entityId as string
    const entity = await EntityModel.getEntityInBranchByEntityId(
      entityId,
      projectBranch._id,
    ) as IEntityDocument

    req.entity = entity

    next()
  } catch (err) {
    next(err)
  }
}
