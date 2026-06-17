import type { NextFunction, Request, Response } from 'express'
import {
  EntityModel,
  IWorkspaceUserDocument,
  RoleModel,
} from '@multiplayer/models'
import {
  IAccess,
  RoleType,
  IIntegrationApiKeyJwtPaylaod,
  IntegrationTypeEnum,
  ObjectTypeEnum,
} from '@multiplayer/types'
import { JwtToken } from '@multiplayer/util'
import { UserLib } from '../../lib'
import { INTEGRATION_JWT_SECRET } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const user = req.user
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const entityId = req.params.entityId as string
    const payload = req.body as (IAccess & { emails?: string[] })

    let invitedWorkspaceUsers: IWorkspaceUserDocument[] = []

    if (payload?.emails?.length) {
      invitedWorkspaceUsers = await Promise.all(payload.emails.map(email =>
        UserLib.inviteWorkspaceUserByEmail(email, workspaceId),
      ))

      const defaultRole = await RoleModel.findDefaultRole(RoleType.PUBLIC_SHARE)

      payload.workspaceUsers = [
        ...(payload?.workspaceUsers || []),
        ...invitedWorkspaceUsers.map(workspaceUser => ({
          workspaceUser: workspaceUser._id.toString(),
          role: defaultRole._id.toString(),
        })),
      ]
    }

    if (payload.publicLink?.token) {
      const jwtPayload: IIntegrationApiKeyJwtPaylaod = {
        workspace: workspaceId,
        project: projectId,
        type: IntegrationTypeEnum.SHARE_API_KEY,
        objectType: ObjectTypeEnum.ENTITY,
        objectId: entityId,
      }

      payload.publicLink.token = JwtToken.generateJwtToken(
        jwtPayload,
        INTEGRATION_JWT_SECRET,
      )
    }

    await EntityModel.updateEntityAccess(
      workspaceId,
      projectId,
      entityId,
      payload,
    )

    delete payload.emails

    return res.status(200).json(payload)
  } catch (err) {
    return next(err)
  }
}
