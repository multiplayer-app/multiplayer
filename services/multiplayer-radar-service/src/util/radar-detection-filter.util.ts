import { RadarDetectionSource } from '@multiplayer/types'

// Translates the ClickHouse-dialect RadarDetectionQueryFilter / RadarDetectionDeleteFilter
// shapes (unchanged - the same filters routes/radar-detections/*.ts already build) into
// native MongoDB query operators. Since detections are single, continuously-reconciled
// documents now (see radar-detection.model.ts), this is a plain filter translation, not
// the read-time reconciliation ClickHouse's query builder had to do.
const buildFieldFilter = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return { $in: value }
  }

  if (value !== null && typeof value === 'object') {
    const operators = value as Record<string, unknown>

    if ('$or' in operators) {
      return { $in: operators.$or }
    }

    if ('$like' in operators) {
      return { $regex: operators.$like, $options: 'i' }
    }

    if ('$not' in operators) {
      return operators.$not === null ? { $nin: [null, ''] } : { $ne: operators.$not }
    }

    // { $columnType: 'array', $value: [...] } - platformIds/environmentNames
    // intersection. Mongo's $in against an array field already matches on any
    // overlap, no special operator needed (unlike arrayIntersect/list_intersect).
    if ('$columnType' in operators && '$value' in operators) {
      return { $in: operators.$value }
    }
  }

  return value
}

// tags: { $arrayExists: [{ key?, value }, ...] } - all entries must match (confirmed:
// the ClickHouse query builder this replaces joined each arrayExists(...) check with
// AND), same as flow-metadata.model.ts's existing tags-array filtering in this lib.
const buildTagsFilter = (arrayExists: { key?: string, value: string }[]) => ({
  $all: arrayExists.map(({ key, value }) => ({
    $elemMatch: { ...(key ? { key } : {}), value },
  })),
})

const buildTimestampFilter = (timestamp: { $lt?: { $date: Date }, $gt?: { $date: Date } }) => {
  const range: Record<string, Date> = {}

  if (timestamp.$lt) {
    range.$lt = new Date(timestamp.$lt.$date)
  }
  if (timestamp.$gt) {
    range.$gt = new Date(timestamp.$gt.$date)
  }

  return range
}

// Sign is never stored (see radar-detection.model.ts) - it's derived from
// isRadarObserved/isDocumented, so filtering on it translates to filtering on those
// two booleans instead.
const SIGN_CONDITIONS: Record<number, { isRadarObserved: boolean, isDocumented: boolean }> = {
  [RadarDetectionSource.RADAR]: { isRadarObserved: true, isDocumented: false },
  [RadarDetectionSource.DOCS]: { isRadarObserved: false, isDocumented: true },
  [RadarDetectionSource.SYNCED]: { isRadarObserved: true, isDocumented: true },
}

const buildSignFilter = (sign: RadarDetectionSource | RadarDetectionSource[]): Record<string, unknown> => {
  const signs = Array.isArray(sign) ? sign : [sign]

  if (signs.length === 1) {
    return SIGN_CONDITIONS[signs[0]]
  }

  return { $or: signs.map((s) => SIGN_CONDITIONS[s]) }
}

export const buildMongoFilter = (filter: Record<string, any>): Record<string, unknown> => {
  const mongoFilter: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined) {
      continue
    }

    if (key === 'Sign') {
      Object.assign(mongoFilter, buildSignFilter(value))
      continue
    }

    if (key === '$or') {
      mongoFilter.$or = (value as Record<string, any>[]).map(buildMongoFilter)
      continue
    }

    if (key === 'tags') {
      const arrayExists = value?.$arrayExists
      if (arrayExists?.length) {
        mongoFilter.tags = buildTagsFilter(arrayExists)
      }
      continue
    }

    if (key === 'Timestamp') {
      mongoFilter.Timestamp = buildTimestampFilter(value)
      continue
    }

    mongoFilter[key] = buildFieldFilter(value)
  }

  return mongoFilter
}

// The effective Sign for API responses - derived, never stored.
export const computeSign = (detection: { isRadarObserved: boolean, isDocumented: boolean }): RadarDetectionSource => {
  if (detection.isRadarObserved && detection.isDocumented) {
    return RadarDetectionSource.SYNCED
  }

  return detection.isRadarObserved ? RadarDetectionSource.RADAR : RadarDetectionSource.DOCS
}
