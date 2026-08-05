import { mongoose } from '@multiplayer/mongo'
import { Model, Document } from 'mongoose'
import { IRadarDetectionParam } from '@multiplayer/types'

const { Schema } = mongoose

// See radar-detection.model.ts for the isRadarObserved/isDocumented design - same
// shape here, for HTTP param detections.
export type IStoredRadarDetectionParam = Omit<IRadarDetectionParam, 'Sign'> & {
  isRadarObserved: boolean
  isDocumented: boolean
}

export interface IRadarDetectionParamDocument extends Omit<IStoredRadarDetectionParam, 'id'>, Document {
  id: string
}

export interface IRadarDetectionParamModel extends Model<IRadarDetectionParamDocument> {
  upsertRadarObservation(
    detections: (Omit<IRadarDetectionParam, 'Sign'> & { id: string })[],
  ): Promise<void>

  upsertDocumentation(
    detections: (Omit<IRadarDetectionParam, 'Sign'> & { id: string })[],
  ): Promise<void>

  clearRadarObservation(filter: Record<string, unknown>): Promise<void>
  clearDocumentation(filter: Record<string, unknown>): Promise<void>
}

const RadarDetectionParamSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  collapse_id: {
    type: String,
  },
  endpointId: {
    type: String,
    required: true,
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
  entityId: String,
  platformId: String,

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

  environmentName: String,
  componentName: String,
  componentAliasName: Boolean,
  mainRefId: String,

  endpointType: {
    type: String,
    required: true,
  },

  httpMethod: String,
  httpEndpoint: String,
  httpStatus: Number,

  messagingSystem: String,
  messagingDestination: String,

  rpcSystem: String,
  rpcService: String,
  rpcMethod: String,

  paramDirection: {
    type: String,
    required: true,
  },
  paramSource: {
    type: String,
    required: true,
  },
  paramPath: String,
  paramType: String,
  paramFormat: String,

  Timestamp: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
})

RadarDetectionParamSchema.index({ workspaceId: 1, projectId: 1 })
RadarDetectionParamSchema.index({ endpointId: 1 })

RadarDetectionParamSchema.statics.upsertRadarObservation = async function (
  detections: (Omit<IRadarDetectionParam, 'Sign'> & { id: string })[],
): Promise<void> {
  if (!detections.length) {
    return
  }

  await this.bulkWrite(
    detections.map(({ id, ...fields }) => ({
      updateOne: {
        filter: { id },
        update: {
          $set: { ...fields, isRadarObserved: true },
          $setOnInsert: { id, isDocumented: false },
        },
        upsert: true,
      },
    })),
  )
}

RadarDetectionParamSchema.statics.upsertDocumentation = async function (
  detections: (Omit<IRadarDetectionParam, 'Sign'> & { id: string })[],
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

RadarDetectionParamSchema.statics.clearRadarObservation = async function (
  filter: Record<string, unknown>,
): Promise<void> {
  await this.updateMany(filter, { $set: { isRadarObserved: false } })
  await this.deleteMany({ ...filter, isRadarObserved: false, isDocumented: false })
}

RadarDetectionParamSchema.statics.clearDocumentation = async function (
  filter: Record<string, unknown>,
): Promise<void> {
  await this.updateMany(filter, { $set: { isDocumented: false } })
  await this.deleteMany({ ...filter, isRadarObserved: false, isDocumented: false })
}

export const RadarDetectionParamModel = mongoose.model<IRadarDetectionParamDocument, IRadarDetectionParamModel>(
  'Radar-Detection-Param',
  RadarDetectionParamSchema,
)
