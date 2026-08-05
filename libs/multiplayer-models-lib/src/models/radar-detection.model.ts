import { mongoose } from '@multiplayer/mongo'
import { Model, Document } from 'mongoose'
import { IRadarDetection } from '@multiplayer/types'

const { Schema } = mongoose

// One document per detection `id`, written independently (and concurrently) by two
// sources: live traffic (RADAR) and the API-doc editor (DOCS). `isRadarObserved`/
// `isDocumented` replace ClickHouse/DuckDB's `Sign` column - a document with both
// true is the equivalent of the old summed Sign=0 (SYNCED) state. Neither source
// reads-before-writing: each write is a single atomic upsert (see
// upsertRadarObservation/upsertDocumentation) that only ever sets its own fields and
// defaults the other source's flag via $setOnInsert, so two independent writers can
// never race each other the way a naive read-modify-write would.
export type IStoredRadarDetection = Omit<IRadarDetection, 'Sign' | 'id'> & {
  id: string
  isRadarObserved: boolean
  isDocumented: boolean
}

export interface IRadarDetectionDocument extends Omit<IStoredRadarDetection, 'id'>, Document {
  id: string
}

export interface IRadarDetectionModel extends Model<IRadarDetectionDocument> {
  upsertRadarObservation(
    detections: (Omit<IRadarDetection, 'Sign'> & { id: string })[],
  ): Promise<void>

  upsertDocumentation(
    detections: (Omit<IRadarDetection, 'Sign' | 'platformIds' | 'environmentNames'> & { id: string })[],
  ): Promise<void>

  clearRadarObservation(filter: Record<string, unknown>): Promise<void>
  clearDocumentation(filter: Record<string, unknown>): Promise<void>

  findDetectionById(id: string): Promise<IRadarDetectionDocument | null>
  findDetectionsByIds(ids: string[]): Promise<IRadarDetectionDocument[]>
}

const RadarDetectionSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  collapse_id: {
    type: String,
  },
  workspaceId: {
    type: String,
    required: true,
  },
  projectId: {
    type: String,
    required: true,
  },
  integrationId: String,
  platformId: String,
  entityId: String,

  isRadarObserved: {
    type: Boolean,
    required: true,
    default: false,
  },
  isDocumented: {
    type: Boolean,
    required: true,
    default: false,
  },

  type: {
    type: String,
    required: true,
  },
  tags: [{
    key: String,
    value: String,
    _id: false,
  }],
  componentName: String,
  hostname: String,

  componentAliasName: Boolean,
  mainRefId: String,

  environmentName: String,
  platformIds: [String],
  environmentNames: [String],

  endpointType: String,

  httpMethod: String,
  httpEndpoint: String,
  rpcSystem: String,
  rpcService: String,
  rpcMethod: String,
  messagingSystem: String,
  messagingDestination: String,

  dependencyType: String,

  sourceComponentName: String,
  sourceEntityId: String,
  sourceEndpointType: String,
  sourceHttpMethod: String,
  sourceHttpEndpoint: String,
  sourceRpcSystem: String,
  sourceRpcService: String,
  sourceRpcMethod: String,
  sourceMessagingSystem: String,
  sourceMessagingDestination: String,

  targetComponentName: String,
  targetEntityId: String,
  targetEndpointType: String,
  targetHttpMethod: String,
  targetHttpEndpoint: String,
  targetRpcSystem: String,
  targetRpcService: String,
  targetRpcMethod: String,
  targetMessagingSystem: String,
  targetMessagingDestination: String,

  Timestamp: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
})

RadarDetectionSchema.index({ workspaceId: 1, projectId: 1 })
RadarDetectionSchema.index({ workspaceId: 1, projectId: 1, type: 1 })

RadarDetectionSchema.statics.upsertRadarObservation = async function (
  detections: (Omit<IRadarDetection, 'Sign'> & { id: string })[],
): Promise<void> {
  if (!detections.length) {
    return
  }

  await this.bulkWrite(
    detections.map(({ id, platformIds, environmentNames, ...fields }) => ({
      updateOne: {
        filter: { id },
        update: {
          $set: { ...fields, isRadarObserved: true },
          $addToSet: {
            ...platformIds?.length ? { platformIds: { $each: platformIds } } : {},
            ...environmentNames?.length ? { environmentNames: { $each: environmentNames } } : {},
          },
          $setOnInsert: { id, isDocumented: false },
        },
        upsert: true,
      },
    })),
  )
}

RadarDetectionSchema.statics.upsertDocumentation = async function (
  detections: (Omit<IRadarDetection, 'Sign' | 'platformIds' | 'environmentNames'> & { id: string })[],
): Promise<void> {
  if (!detections.length) {
    return
  }

  await this.bulkWrite(
    detections.map(({ id, ...fields }) => ({
      updateOne: {
        filter: { id },
        update: {
          $set: { ...fields, isDocumented: true },
          $setOnInsert: { id, isRadarObserved: false },
        },
        upsert: true,
      },
    })),
  )
}

RadarDetectionSchema.statics.clearRadarObservation = async function (
  filter: Record<string, unknown>,
): Promise<void> {
  await this.updateMany(filter, {
    $set: { isRadarObserved: false, platformIds: [], environmentNames: [] },
  })
  await this.deleteMany({ ...filter, isRadarObserved: false, isDocumented: false })
}

RadarDetectionSchema.statics.clearDocumentation = async function (
  filter: Record<string, unknown>,
): Promise<void> {
  await this.updateMany(filter, {
    $set: { isDocumented: false },
  })
  await this.deleteMany({ ...filter, isRadarObserved: false, isDocumented: false })
}

RadarDetectionSchema.statics.findDetectionById = function (
  id: string,
) {
  return this.findOne({ id })
}

RadarDetectionSchema.statics.findDetectionsByIds = function (
  ids: string[],
) {
  if (!ids.length) {
    return []
  }

  return this.find({ id: { $in: ids } })
}

export const RadarDetectionModel = mongoose.model<IRadarDetectionDocument, IRadarDetectionModel>(
  'Radar-Detection',
  RadarDetectionSchema,
)
