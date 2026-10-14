import type { Request, Response, NextFunction } from 'express'
import { IntegrationModel } from '@multiplayer/models'
import { IntegrationTypeEnum } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const type = 'type' in req.query ? req.query.type as IntegrationTypeEnum : undefined
    const project = 'project' in req.query ? req.query.project as string : undefined

    const filter: {
      workspace: string,
      type?: IntegrationTypeEnum,
      project?: string,
    } = {
      workspace: workspaceId,
      type,
      project,
    }

    const integrations = await IntegrationModel.findIntegrations(filter, { skip, limit })

    integrations.data.forEach(integration => {
      if (integration?.gitlab) {
        delete integration?.gitlab.accessToken
        delete integration?.gitlab.refreshToken
      }
      if (integration?.github) {
        delete integration?.github.accessToken
      }
      if (integration?.bitbucket) {
        delete integration?.bitbucket.accessToken
        delete integration?.bitbucket.refreshToken
      }
      if (integration?.atlassian) {
        delete integration?.atlassian.accessToken
        delete integration?.atlassian.refreshToken
      }
      if (integration?.linear) {
        delete integration?.linear.accessToken
      }
      if (integration?.apiKey) {
        delete integration?.apiKey
      }
      if (integration?.otel) {
        delete integration?.otel.apiKey
      }
      if (integration?.shareApiKey) {
        delete integration?.shareApiKey.apiKey
      }
      if (integration?.slack) {
        delete integration?.slack.accessToken
      }
    })

    return res.status(200).json(integrations)
  } catch (err) {
    return next(err)
  }
}
