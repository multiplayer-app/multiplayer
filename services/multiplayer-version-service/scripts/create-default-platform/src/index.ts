import mongo from '@multiplayer/mongo'
import {
  ProjectModel,
  EntityModel,
  ProjectBranchModel,
} from '@multiplayer/models'
import { EntityType } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import axios from 'axios'

(async () => {
  try {
    const INTERNAL_VERSION_SERVICE_URI: string = process.env.INTERNAL_VERSION_SERVICE_URI || ''

    await mongo.connect()

    for await (const project of ProjectModel.find({}).cursor()) {
      const defaultBranch = await ProjectBranchModel.findOne({
        project: project._id.toString(),
        default: true,
      })

      if (!defaultBranch) {
        logger.error(`NOT_FOUND_DEFAULT_BRANCH ${project._id.toString()}`)
        continue
      }

      const defaultPlatform = await EntityModel.findOne({
        project: project._id.toString(),
        projectBranch: defaultBranch?._id.toString(),
        default: true,
        type: EntityType.PLATFORM,
      })


      if (!defaultPlatform) {
        try {
          await axios.post(
            `${INTERNAL_VERSION_SERVICE_URI}/workspaces/${project.workspace?.toString()}/projects/${project._id.toString()}/branches/${defaultBranch?._id.toString()}/entities`,
            {
              key: 'system-map',
              type: EntityType.PLATFORM,
              archived: false,
              default: true,
            },
          )
        } catch (e) {
          logger.error(e)
        }
      }
    }


  } catch (err) {
    logger.error(err)
  } finally {
    await mongo.disconnect()
    process.exit()
  }
})()