import logger from '@multiplayer/logger'
import {
  GitRepositoryModel,
  GitRefTagModel,
  ProjectLinkModel,
} from '@multiplayer/models'
import type { Octokit } from '@octokit/rest'

const handleRepositoryRename = async (payload) => {
  await GitRepositoryModel.updateGitRepositoriesByGitId(
    payload.repository.id,
    {
      'gitRepository._id': encodeURIComponent(payload.repository.full_name),
      'gitRepository.owner': payload.repository.owner.name,
      'gitRepository.name': payload.repository.name,
      'gitRepository.url': payload.repository.url,
      'gitRepository.defaultBranch': payload.repository.defaultBranch,
    },
  )
}

const handleFileRename = async (payload, octokit: Octokit) => {
  const branch = payload.ref.replace('refs/heads/' ,'')

  const commit = await octokit.request(
    'GET /repos/{owner}/{repo}/commits/{ref}', {
      owner: payload.repository.owner.name as string,
      repo: payload.repository.name as string,
      ref: payload.commits[payload.commits.length - 1].id,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

  await Promise.all(commit.data.files?.filter(file => file.status === 'renamed').map(file =>
    Promise.all([
      GitRefTagModel.updateGitRefTagGitPath(
        payload.repository.id as string,
        branch,
        file.previous_filename as string,
        file.filename as string,
      ),
      ProjectLinkModel.updateProjectLinkGitPath(
        payload.repository.id as string,
        branch,
        file.previous_filename as string,
        file.filename as string,
      ),
    ])) || [])
}

export default async ({ id, name, payload, octokit }: {
  id: string,
  name: string,
  payload: any,
  octokit: Octokit
}) => {
  try {
    if (
      name === 'repository'
      && payload.action === 'renamed'
    ) {
      await handleRepositoryRename(payload)
    } else if (name === 'push') {
      await handleFileRename(payload, octokit)
    }

  } catch (err) {
    logger.error(err, 'Github webhook error')
  }
}
