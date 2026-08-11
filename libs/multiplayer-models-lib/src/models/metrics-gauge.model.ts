import { mongoose } from '@multiplayer/mongo'
import { Model, Document } from 'mongoose'
import { OtlpMetricsGauge } from '@multiplayer/types'

const { Schema } = mongoose

// Pure append-only (no id/upsert) - mirrors otel_metrics_gauge's plain MergeTree (no
// ReplacingMergeTree) in ClickHouse/DuckDB. `Attributes` is stored as an array of
// {key,value} pairs rather than a nested object because attribute keys (e.g.
// "multiplayer.issue.hash") contain dots, which Mongo can't use as literal field
// names - same convention as tags on radar-detection.model.ts/flow-metadata.model.ts.
// `Exemplars` is never populated by any producer in this codebase - intentionally
// dropped rather than persisted.
export type IStoredMetricsGauge = Omit<OtlpMetricsGauge, 'Exemplars' | 'Attributes' | 'ResourceAttributes' | 'ScopeAttributes' | 'TimeUnix' | 'StartTimeUnix'> & {
  workspaceId: string
  projectId: string
  Attributes: { key: string, value: string }[]
  ResourceAttributes?: { key: string, value: string }[]
  ScopeAttributes?: { key: string, value: string }[]
  TimeUnix: Date
  StartTimeUnix: Date
}

export interface IMetricsGaugeDocument extends IStoredMetricsGauge, Document {}

export interface IMetricsGaugeModel extends Model<IMetricsGaugeDocument> {
  insertGauges(gauges: (OtlpMetricsGauge & { workspaceId: string, projectId: string })[]): Promise<void>
}

const AttributePairSchema = new Schema({
  key: String,
  value: String,
}, { _id: false })

const MetricsGaugeSchema = new Schema({
  workspaceId: {
    type: String,
    required: true,
  },
  projectId: {
    type: String,
    required: true,
  },

  ResourceAttributes: [AttributePairSchema],
  ResourceSchemaUrl: String,
  ScopeName: String,
  ScopeVersion: String,
  ScopeAttributes: [AttributePairSchema],
  ScopeDroppedAttrCount: Number,
  ScopeSchemaUrl: String,
  ServiceName: String,

  MetricName: {
    type: String,
    required: true,
  },
  MetricDescription: String,
  MetricUnit: {
    type: String,
    required: true,
  },
  Attributes: [AttributePairSchema],

  StartTimeUnix: {
    type: Date,
    required: true,
  },
  TimeUnix: {
    type: Date,
    required: true,
  },
  Value: {
    type: Number,
    required: true,
  },
  Flags: Number,
})

MetricsGaugeSchema.index({ workspaceId: 1, projectId: 1 })
MetricsGaugeSchema.index({ MetricName: 1, TimeUnix: 1 })
MetricsGaugeSchema.index({ 'Attributes.key': 1, 'Attributes.value': 1 })
// Mirrors the 90-day TTL the old ClickHouse otel.otel_metrics_gauge table had.
MetricsGaugeSchema.index({ TimeUnix: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

const toAttributePairs = (attributes?: Record<string, string>): { key: string, value: string }[] =>
  Object.entries(attributes || {}).map(([key, value]) => ({ key, value }))

MetricsGaugeSchema.statics.insertGauges = async function (
  gauges: (OtlpMetricsGauge & { workspaceId: string, projectId: string })[],
): Promise<void> {
  if (!gauges.length) {
    return
  }

  await this.insertMany(
    gauges.map(({ Exemplars, ResourceAttributes, ScopeAttributes, Attributes, TimeUnix, StartTimeUnix, ...fields }) => ({
      ...fields,
      ResourceAttributes: toAttributePairs(ResourceAttributes),
      ScopeAttributes: toAttributePairs(ScopeAttributes),
      Attributes: toAttributePairs(Attributes),
      TimeUnix: new Date(TimeUnix),
      StartTimeUnix: new Date(StartTimeUnix),
    })),
  )
}

export const MetricsGaugeModel = mongoose.model<IMetricsGaugeDocument, IMetricsGaugeModel>(
  'MetricsGauge',
  MetricsGaugeSchema,
)
