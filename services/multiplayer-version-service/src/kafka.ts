import { KafkaConsumer, KafkaProducer } from '@multiplayer/kafka'
import { COMMIT_TIMEOUT_INTERVAL_MS, KAFKA_ENTITY_UPDATES_TOPIC, S3_PRIVATE_BUCKET, SERVICE_NAME } from './config'
import logger from '@multiplayer/logger'
import { Joi, JoiValidator } from '@multiplayer/util'
import {
  DataWithCursor,
  EntityCommitStorageType,
  ProjectBranchStatus,
} from '@multiplayer/types'
import {
  EntityContentModel,
  EntityUpdateContext,
  EntityUpdateModel,
  IEntityUpdateDocument,
  IPopulatedEntityStateDocument,
  IProjectBranchDocument,
  ProjectBranchModel,
} from '@multiplayer/models'
import redis from '@multiplayer/redis'
import { s3 } from '@multiplayer/s3'
import { EntityUpdateLib, ProjectBranchLib } from './lib'
import { EntityUpdateHelper } from './helpers'
import { EntityConverter } from '@multiplayer/entity'

class EntityUpdatesKafkaConsumer {
  private kafkaConsumer: KafkaConsumer
  private static messageSchema = Joi.object({
    workspace: Joi.string().hex().length(24).required(),
    project: Joi.string().hex().length(24).required(),
    projectBranch: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  })

  private timers: Record<string, NodeJS.Timeout> = {}

  constructor() {
    this.kafkaConsumer = new KafkaConsumer(SERVICE_NAME)
  }

  private validateMessage(message: EntityUpdateContext): boolean {
    try {
      JoiValidator.validate(message, EntityUpdatesKafkaConsumer.messageSchema)
      return true
    } catch (err) {
      logger.info(err)
      return false
    }
  }

  private scheduleCommitCheck(params: EntityUpdateContext, timeout?: number) {
    const key = this.getLockKey(params)
    if (this.timers[key])
      return
    this.timers[key] = setTimeout(
      async () => {
        delete this.timers[key]
        await this.triggerCommitCheck(params)
      }, timeout || COMMIT_TIMEOUT_INTERVAL_MS)
  }

  private clearTimeout(params: EntityUpdateContext) {
    const key = this.getLockKey(params)
    if (!this.timers[key]) return
    clearTimeout(this.timers[key])
    delete this.timers[key]
  }

  private async cleanupUnusedUpdates(params: EntityUpdateContext) {
    return Promise.all([
      EntityUpdateModel.deleteEntityUpdates(params),
      s3.deleteObjectsByPrefix(
        S3_PRIVATE_BUCKET,
        EntityUpdateHelper.getS3Key({
          workspaceId: params.workspace,
          projectId: params.project,
          entityId: params.entityId,
        }),
      ),
    ])
  }

  public async triggerCommitCheck(params: EntityUpdateContext) {
    const availableUpdates = await EntityUpdateModel.listEntityUpdates({
      workspace: params.workspace,
      project: params.project,
      projectBranch: params.projectBranch,
      entityId: params.entityId,
    }, { limit: 0 })

    if (!availableUpdates.cursor.total) {
      return
    }
    const projectBranch = await ProjectBranchModel.findProjectBranchById(params.projectBranch)
    if (!projectBranch) {
      logger.info('Project branch does not exist, cleanup unused updates', params)
      await this.cleanupUnusedUpdates(params)
      return
    }
    if (projectBranch.status === ProjectBranchStatus.MERGED) {
      await this.cleanupUnusedUpdates(params)
      logger.info('Project branch is blocked from change, cleanup unused updates', params)
      return
    }

    const entityState = await ProjectBranchLib.getLatestEntityState(params.projectBranch, params.entityId)
    if (!entityState) {
      await this.cleanupUnusedUpdates(params)
      logger.info('Entity does not exist anymore, cleanup unused updates', params)
      return
    }

    if (entityState.entityCommit.storageType !== EntityCommitStorageType.S3) {
      await this.cleanupUnusedUpdates(params)
      logger.info('Entity is static, cleanup unused updates', params)
      return
    }

    await this.commitIfNeeded({
      workspace: params.workspace,
      project: params.project,
      projectBranch: params.projectBranch,
      entityId: params.entityId,
    }, entityState, projectBranch)
  }

  private getLockKey(message: EntityUpdateContext) {
    return `${message.workspace}.${message.project}.${message.projectBranch}.${message.entityId}`
  }

  private async acquireLock(message: EntityUpdateContext, expiration = 20) {
    const lockKey = this.getLockKey(message)
    const res = await redis.set(lockKey, 'locked', expiration, { NX: true })
    logger.debug(res)
    return res === 'OK'
  }

  private async releaseLock(message: EntityUpdateContext) {
    const lockKey = this.getLockKey(message)
    await redis.del(lockKey)
  }

  async commit(
    params: EntityUpdateContext,
    entityState: IPopulatedEntityStateDocument,
    projectBranch: IProjectBranchDocument,
    availableUpdates: IEntityUpdateDocument[],
  ) {
    try {
      this.clearTimeout(params)
      await EntityUpdateLib.commitEntityUpdates(params,
        entityState,
        projectBranch,
        availableUpdates,
      )
    } catch (err) {
      logger.error(err)
      throw err
    } finally {
      this.scheduleCommitCheck(params)
    }
  }

  async commitIfNeeded(params: EntityUpdateContext, entityState: IPopulatedEntityStateDocument, projectBranch: IProjectBranchDocument) {
    if (!entityState.entityCommit.key || !entityState.entityCommit.bucket) {
      logger.error('s3 commit without s3 data', entityState.entityCommit._id)
      throw new Error('EntityCommit does not contain required data')
    }

    const acquired = await this.acquireLock(params)
    if (!acquired) {
      logger.debug('Commit lock exists', params)
      return
    }

    try {
      const availableUpdates = await EntityUpdateModel.listEntityUpdates({
        workspace: params.workspace,
        project: params.project,
        projectBranch: params.projectBranch,
        entityId: params.entityId,
      }, {})

      const numOfUpdates = availableUpdates.cursor.total
      if (!numOfUpdates || !availableUpdates.data.length) {
        return
      }
      const passedTimeMs = new Date().getTime() - new Date(availableUpdates.data[0].createdAt).getTime()
      const isFirstFeatureCommit = !entityState.entityCommit.projectBranch.equals(params.projectBranch)
      const shouldCreateCommit = isFirstFeatureCommit || numOfUpdates > 30 || passedTimeMs > COMMIT_TIMEOUT_INTERVAL_MS
      if (!shouldCreateCommit) {
        this.scheduleCommitCheck(params)
        await this.storeInterimEntityData(params, entityState, availableUpdates.data)
        return
      }
      await this.commit(params,
        entityState,
        projectBranch,
        availableUpdates.data,
      )
    } catch (err) {
      logger.error(err)
      throw err
    }
    finally {
      await this.releaseLock(params)
    }
  }

  async storeInterimEntityData(
    params: EntityUpdateContext,
    entityState: IPopulatedEntityStateDocument,
    availableUpdates: IEntityUpdateDocument[]) {
    const { doc } = await EntityUpdateLib.buildLatestEntityDoc(entityState, availableUpdates)
    const newDoc = EntityConverter.convertYDocToData(entityState.entity.type, doc)
    await EntityContentModel.createEntityContent({
      workspace: params.workspace,
      project: params.project,
      projectBranch: params.projectBranch,
      type: entityState.entity.type,
      data: newDoc,
      entityId: entityState.entity.entityId,
    })
  }

  async listen(key: string, value: EntityUpdateContext) {
    try {
      const isValidMessage = this.validateMessage(value)
      if (!isValidMessage) {
        logger.info('Kafka message is invalid', value)
        return
      }
      await this.triggerCommitCheck(value)
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  async processLeftEntityUpdates() {
    const limit = 30
    let skip = 0
    let groups: DataWithCursor<EntityUpdateContext>
    do {
      groups = await EntityUpdateModel.listEntityUpdatesGroups({}, { skip, limit })

      await Promise.all(groups.data.map((group) =>
        kafkaProducer.send(KAFKA_ENTITY_UPDATES_TOPIC, group)),
      )
      skip += limit
    } while (skip < groups.cursor.total)
  }

  async connect() {
    await this.kafkaConsumer.connect()
    await this.kafkaConsumer.subscribe(KAFKA_ENTITY_UPDATES_TOPIC, this.listen.bind(this))
    await this.processLeftEntityUpdates()
    await this.kafkaConsumer.listen()
  }

  async disconnect() {
    return this.kafkaConsumer.disconnect()
  }

  async isConnected() {
    return this.kafkaConsumer.isConnected()
  }
}

export const kafkaConsumer = new EntityUpdatesKafkaConsumer()
export const kafkaProducer = new KafkaProducer()