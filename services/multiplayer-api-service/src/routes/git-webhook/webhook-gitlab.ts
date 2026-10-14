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
    String(event.project.id),
    {
      'gitRepository.owner': event.project.namespace,
      'gitRepository.name': event.project.name,
      'gitRepository.url': event.project.url,
      'gitRepository.defaultBranch': event.project.default_branch,
    },
  )
}

const handleFileRename = async (event) => {
  const branch = event.ref.replace('refs/heads/', '')

  const { data: [gitRepository] } = await GitRepositoryModel.findGitRepositories({
    gitRepositoryId: String(event.project.id),
  })

  if (!gitRepository) {
    return
  }

  const { data: [integration] } = await IntegrationModel.findIntegrations({
    workspace: gitRepository.workspace,
    type: IntegrationTypeEnum.GITLAB,
  })

  if (!integration) {
    return
  }

  const commitChanges = await GitProviderUtil.getCommit(
    integration,
    gitRepository.gitRepository._id,
    event.commits[event.commits.length - 1].id,
  )

  await Promise.all(commitChanges?.filter(file => file.renamed_file).map(file =>
    Promise.all([
      GitRefTagModel.updateGitRefTagGitPath(
        String(event.project.id),
        branch,
        file.old_path as string,
        file.new_path as string,
      ),
      ProjectLinkModel.updateProjectLinkGitPath(
        String(event.project.id),
        branch,
        file.old_path as string,
        file.new_path as string,
      ),
    ])) || [])
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = req.body

    if (event.event_name === 'push') {
      await handleRepositoryRename(event)
      await handleFileRename(event)
    }

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
