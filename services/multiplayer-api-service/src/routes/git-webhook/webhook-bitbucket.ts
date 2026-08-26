import type { Request, Response, NextFunction } from 'express'
import {
  GitRepositoryModel,
  IntegrationModel,
  GitRefTagModel,
  ProjectLinkModel,
} from '@multiplayer/models'
import { IntegrationTypeEnum } from '@multiplayer/types'
import { GitProviderUtil } from '../../util'

const handleRepositoryRename = async (event) => {
  await GitRepositoryModel.updateGitRepositoriesByGitId(
    event.repository.uuid,
    {
      'gitRepository._id': event.repository.uuid,
      'gitRepository.owner': event.repository.owner.nickname,
      'gitRepository.name': event.repository.name,
      'gitRepository.url': event.repository.links.html.href,
    },
  )
}

const handleFileRename = async (event) => {
  if (event?.push?.changes?.[0]?.new?.type !== 'branch') {
    return
  }
  const branch = event?.push?.changes[0].new.name

  const { data: [gitRepository] } = await GitRepositoryModel.findGitRepositories({
    gitRepositoryId: `${event.repository.workspace.uuid}/${event.repository.uuid}`,
  })

  if (!gitRepository) {
    return
  }

  const { data: [integration] } = await IntegrationModel.findIntegrations({
    workspace: gitRepository.workspace,
    type: IntegrationTypeEnum.BITBUCKET,
  })

  if (!integration) {
    return
  }

  const commit = await GitProviderUtil.getCommit(
    integration,
    gitRepository.gitRepository._id,
    event.push.changes[0].commits[event.push.changes[0].commits.length - 1].hash,
  )

  await Promise.all(commit.values?.filter(file => file.status === 'renamed').map(file =>
    Promise.all([
      GitRefTagModel.updateGitRefTagGitPath(
        event.repository.uuid as string,
        branch,
        file.old.path as string,
        file.new.path as string,
      ),
      ProjectLinkModel.updateProjectLinkGitPath(
        event.repository.uuid as string,
        branch,
        file.old.path as string,
        file.new.path as string,
      ),
    ])) || [])
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = req.body

    if (
      event?.repository?.type === 'repository'
      && event?.changes?.name
    ) {
      await handleRepositoryRename(event)
    } else if (
      event?.repository?.type === 'repository'
      && event?.push?.changes
    ) {
      await handleFileRename(event)
    }

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
