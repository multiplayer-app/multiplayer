import mongo from '@multiplayer/mongo'
import { EntityModel, IEntityDocument, ProjectModel } from '@multiplayer/models'
import logger from '@multiplayer/logger'
import * as Opensearch from '../lib/opensearch'
import { NotFoundError } from 'restify-errors'
import { AssistantController } from '../lib/assistant'
import { EntityType } from '@multiplayer/types'

(async () => {
  try {
    await mongo.connect()
    logger.info('Initializing opensearch')
    await Opensearch.init()

    logger.info('Starting script')
    const workspaceId = process.argv[2]
    const override = true

    let skip = 0
    let total = 0

    const errors: IEntityDocument[] = []

    do {
      const entities = await EntityModel.getAllEntities({
        workspaceId,
        types: [EntityType.API],
      }, { skip, limit: 10 })
      logger.info(entities.data.length, 'entities to proceed')
      await Promise.all(entities.data.map(async (entity) => {
        try {
          const found = await ProjectModel.findProjectById(entity.project)
          if (!found) return
          const params = {
            workspaceId: entity.workspace.toString(),
            projectId: entity.project.toString(),
            branchId: entity.projectBranch.toString(),
            entityId: entity.entityId.toString(),
          }
          await AssistantController.createVectorData(params, override)
        } catch (err) {
          if (err instanceof NotFoundError) {
            return
          }
          logger.error(entity)
          logger.error(err)
          errors.push(entity)
        }
      }))

      skip += entities.data.length
      total = entities.cursor.total
      logger.info(skip, 'processed of ', total)

    } while (skip < total)
    logger.debug('------------------')
    logger.debug('total: ', total)
    logger.debug('errors total: ', errors.length)
    logger.debug('failed entities: ', errors)
    await Opensearch.EntityIndex.reindex()
  } catch (err) {
    logger.error(err)
  } finally {
    await mongo.disconnect()
  }
  process.exit()
})()
