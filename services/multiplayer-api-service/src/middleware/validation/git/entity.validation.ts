import type { Request, Response, NextFunction } from 'express'
import { NotFoundError, InvalidArgumentError } from 'restify-errors'
import { EntityType } from '@multiplayer/types'
import { EntityModel } from '@multiplayer/models'
import { getValueByPath } from '@multiplayer/util-shared'

export const validateEntityTypeIs = ({
  type,
  entityIdPath,
}: { type: EntityType, entityIdPath: string, }) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.body.project
    const entityId = getValueByPath(req, entityIdPath)

    if (entityId) {
      const entity = await EntityModel.findEntityInProjectAndWorkspace(
        entityId,
        projectId,
        workspaceId,
      )

      if (!entity) {
        throw new NotFoundError('Entity not found')
      }

      if (entity.type !== type) {
        throw new InvalidArgumentError('Invalid entity type')
      }
    }

    return next()
  } catch (error) {
    return next(error)
  }
}
