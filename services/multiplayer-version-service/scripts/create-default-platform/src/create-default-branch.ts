import mongo from '@multiplayer/mongo'
import {
  ProjectModel,
  // EntityModel,
  ProjectBranchModel,
  EntityCommitModel,
  CommitModel,
} from '@multiplayer/models'
import {
  // EntityType,
  // ProjectBranchType,
  // ProjectBranchStatus,
  CommitType,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'
// import axios from 'axios'

(async () => {
  try {
    // const INTERNAL_VERSION_SERVICE_URI: string = process.env.INTERNAL_VERSION_SERVICE_URI || ''

    await mongo.connect()

    for await (const project of ProjectModel.find({}).cursor()) {
      const defaultBranch = await ProjectBranchModel.findOne({
        project: project._id.toString(),
        default: true,
      })

      if (!defaultBranch) {
        logger.error(`NOT_FOUND_DEFAULT_BRANCH_FOR_PROJECT_${project._id.toString()}`)
        continue
      }

      const entityCommit = await EntityCommitModel.findOne({
        workspace: project.workspace,
        project: project._id,
        projectBranch: defaultBranch._id,
      })

      if (!entityCommit) {
        const commitPayload = {
          workspace: project.workspace,
          project: project._id,
          projectBranch: defaultBranch,
          type: CommitType.AUTO,
          message: 'Initial commit (Project created).',
        }
        await CommitModel.createCommit(commitPayload)

        // eslint-disable-next-line
        console.log('CREATED_COMMIT_FOR____', project._id.toString())
      }
    }


  } catch (err) {
    logger.error(err)
  } finally {
    await mongo.disconnect()
    process.exit()
  }
})()