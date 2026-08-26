import { mongoose } from '@multiplayer/mongo'
import { Model, Document } from 'mongoose'
import { IFlow } from '@multiplayer/types'

const { Schema } = mongoose

// One document per flow `id`, plain last-write-wins upsert - unlike detections there's
// only ever a single writer (FlowWorker.createFlow), so no split-write reconciliation
// is needed here (mirrors ClickHouse/DuckDB's ReplacingMergeTree/ON CONFLICT DO UPDATE
// upsert semantics for this table).
export interface IFlowDocument extends Omit<IFlow, 'id'>, Document {
  id: string
}

export interface IFlowModel extends Model<IFlowDocument> {
  upsertFlow(flow: IFlow): Promise<void>
  findFlowById(id: string): Promise<IFlowDocument | null>
  deleteFlowById(id: string): Promise<void>
  deleteFlows(filter: Record<string, unknown>): Promise<void>
  listUniqueComponentNames(filter: Record<string, unknown>): Promise<string[]>
}

const FlowSequenceSchema = new Schema({
  spanId: String,
  parentSpanId: String,
  componentName: String,
  httpMethod: String,
  httpEndpoint: String,
  name: String,
  kind: Number,
  httpStatus: Number,
  messagingSystem: String,
  messagingDestination: String,
  dbSystem: String,
  rpcSystem: String,
  rpcService: String,
  rpcMethod: String,
}, { _id: false })

const FlowSchema = new Schema({
  id: {
    type: String,
    unique: true,
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
  sequence: [FlowSequenceSchema],
  Timestamp: Date,
}, {
  timestamps: true,
})

FlowSchema.index({ workspaceId: 1, projectId: 1 })

FlowSchema.statics.upsertFlow = async function (flow: IFlow): Promise<void> {
  const { id, ...fields } = flow

  await this.updateOne(
    { id },
    { $set: fields },
    { upsert: true },
  )
}

FlowSchema.statics.findFlowById = function (id: string) {
  return this.findOne({ id })
}

FlowSchema.statics.deleteFlowById = async function (id: string): Promise<void> {
  await this.deleteOne({ id })
}

FlowSchema.statics.deleteFlows = async function (filter: Record<string, unknown>): Promise<void> {
  await this.deleteMany(filter)
}

FlowSchema.statics.listUniqueComponentNames = function (filter: Record<string, unknown>): Promise<string[]> {
  return this.distinct('sequence.componentName', filter)
}

export const FlowModel = mongoose.model<IFlowDocument, IFlowModel>('Flow', FlowSchema)
