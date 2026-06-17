import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import { fetch } from '@multiplayer/fetch'
import {
  ProjectBranchModel,
  EntityModel,
} from '@multiplayer/models'
import {
  CollaborationAMQPMessageType,
  EntityType,
  RadarDetectionSource,
  EntityCommitChangeType,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'
import AMQP from '@multiplayer/amqp'
import * as Clickhouse from '@multiplayer/clickhouse'
import { slugifyString } from '@multiplayer/util-shared'

export const AMQP_EVENT_QUEUE = process.env.AMQP_EVENT_QUEUE || 'event'
export const CLICKHOUSE_RADAR_DB = process.env.CLICKHOUSE_RADAR_DB || 'radar'
export const CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME = process.env.CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME || 'detections'

export const INTERNAL_VERSION_SERVICE_URI = process.env.INTERNAL_VERSION_SERVICE_URI || 'http://localhost:3006/internal/v0/version'

const main = async () => {
  let exitWithError = false
  try {
    await mongo.connect()
    await AMQP.connect()
    await Clickhouse.connect()

    const branchesCount = await ProjectBranchModel.countDocuments({ default: true })
    let branchIndex = 0

    await Clickhouse.remove(
      `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}`,
      {
        // workspaceId: projectBranch.workspace.toString(),
        // projectId: projectBranch.project.toString(),
        Sign: RadarDetectionSource.DOCS,
      },
    )

    for await (const projectBranch of ProjectBranchModel.find({ default: true }).cursor()) {
      const entityFilter = {
        projectBranch: projectBranch._id,
        archivedAtCommit: { $exists: false },
        deletedAtCommit: { $exists: false },
        archived: { $ne: true },
        typeOfChangeInBranch: { $nin: [EntityCommitChangeType.ARCHIVE, EntityCommitChangeType.DELETE] },
        type: { $in: [EntityType.ENVIRONMENT, EntityType.PLATFORM_COMPONENT] },
      }

      let entityIndex = 0
      const entitiesCount = await EntityModel.countDocuments(entityFilter)

      for await (const entity of EntityModel.find(entityFilter).lean().cursor()) {
        logger.info(`Processing entities in branch ${branchIndex}/${branchesCount}, entity ${entityIndex}/${entitiesCount}`)

        let _entity = entity as any//.toJSON()

        // if (_entity.tags?.length) {
        //   const _tags = _entity.tags
        //     .filter((tag: any) => typeof tag === 'string')
        //     .map((tag: any) => ({ value: tag })) as unknown as { value: string }[]

        //   if (_tags.length) {

        const updatePayload = {
          key: slugifyString(entity.key),
          keyAliases: entity.keyAliases?.length
            ? entity.keyAliases.map(alias => slugifyString(alias))
            : [],
        }

        try {
          _entity = await EntityModel.findOneAndUpdate({
            _id: entity._id,
          }, {
            $set: updatePayload,
          }, {
            runValidators: true,
            new: true,
          })

          await AMQP.publish(
            AMQP_EVENT_QUEUE,
            {
              type: CollaborationAMQPMessageType.ENTITY_UPDATE,
              variables: {
                entity: _entity,
                entityUpdatedAt: _entity.updatedAt || '',
                isDefaultBranch: !!projectBranch.default,
                branchId: projectBranch._id.toString(),
              },
            },
            { durable: true, fanout: true },
          )


        } catch (err: any) {
          // console.log('ERR_______UPDATING___ENTITIY::', {
          //   // errMsg: err.message,
          //   entityId: entity._id,
          //   before: {
          //     key: entity.key,
          //     keyAliases: entity.keyAliases,
          //   },
          //   after: updatePayload,
          // })

          if ((err?.message as string)?.includes('E11000 duplicate key error collection')) {
            try {
              await fetch.delete(`${INTERNAL_VERSION_SERVICE_URI}/workspaces/${entity.workspace}/projects/${entity.project}/branches/${projectBranch._id}/entities/${entity.entityId}`)
            } catch (axiosErr) {
              logger.error({
                axiosErr,
                workspace: entity.workspace,
                project: entity.project,
                projectBranch: projectBranch._id,
                entityId: entity.entityId,
              }, 'Failed to delete entity')
            }

            // _entity = await EntityModel.findOneAndUpdate({
            //   _id: entity._id,
            // }, {
            //   $set: updatePayload,
            // }, {
            //   runValidators: true,
            //   new: true,
            // })

            // await AMQP.publish(
            //   AMQP_EVENT_QUEUE,
            //   {
            //     type: CollaborationAMQPMessageType.ENTITY_UPDATE,
            //     variables: {
            //       entity: _entity,
            //       entityUpdatedAt: _entity.updatedAt || '',
            //       isDefaultBranch: !!projectBranch.default,
            //       branchId: projectBranch._id.toString(),
            //     },
            //   },
            //   { durable: true, fanout: true },
            // )
          }
        }

        //     _entity.tags = _tags
        //   }
        // }



        entityIndex++
      }

      branchIndex++
    }

  } catch (err) {
    exitWithError = true
    logger.error(err)
  } finally {
    await mongo.disconnect()
    await Clickhouse.disconnect()
    await AMQP.disconnect()

    process.exit(Number(exitWithError))
  }
}

main()
