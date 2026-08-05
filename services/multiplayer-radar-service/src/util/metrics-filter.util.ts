// Translates the ClickHouse-dialect conditions objects metrics.service.ts already
// builds (unchanged - same `Attributes['<key>']` bracket-keyed shape used against
// ClickHouse's native Map(String,String) column) into native Mongo. `Attributes` is
// stored as an array of {key,value} pairs (see metrics-gauge.model.ts - Mongo can't
// use attribute keys like "multiplayer.issue.hash" as literal nested-object field
// names since they contain dots), so each `Attributes['<key>']` condition becomes an
// $elemMatch, and multiple such conditions combine via $all - same pattern as
// flow-metadata.model.ts's tags filtering and radar-detection-filter.util.ts.
const ATTRIBUTE_KEY_PATTERN = /^Attributes\['(.+)'\]$/

const buildAttributeElemMatch = (key: string, value: unknown): Record<string, unknown> => {
  if (value !== null && typeof value === 'object') {
    const operators = value as Record<string, unknown>

    if ('$exists' in operators) {
      // Only `{$exists: true}` is ever used (attribute-key-is-present, regardless of
      // value) - there's no `$exists: false` call site to support.
      return { key }
    }

    if ('$in' in operators) {
      return { key, value: { $in: operators.$in } }
    }
  }

  return { key, value }
}

export const buildMetricsFilter = (conditions: Record<string, unknown>): Record<string, unknown> => {
  const filter: Record<string, unknown> = {}
  const attributeMatches: Record<string, unknown>[] = []

  for (const [key, value] of Object.entries(conditions)) {
    if (value === undefined) {
      continue
    }

    const attributeKeyMatch = key.match(ATTRIBUTE_KEY_PATTERN)

    if (attributeKeyMatch) {
      attributeMatches.push({ $elemMatch: buildAttributeElemMatch(attributeKeyMatch[1], value) })
      continue
    }

    if (key === 'TimeUnix' && value !== null && typeof value === 'object') {
      const range = value as { $lt?: { $date: Date }, $gt?: { $date: Date } }
      const timeFilter: Record<string, Date> = {}

      if (range.$lt) {
        timeFilter.$lt = new Date(range.$lt.$date)
      }
      if (range.$gt) {
        timeFilter.$gt = new Date(range.$gt.$date)
      }

      filter.TimeUnix = timeFilter
      continue
    }

    filter[key] = value
  }

  if (attributeMatches.length) {
    filter.Attributes = { $all: attributeMatches }
  }

  return filter
}

// Extracts "multiplayer.issue.hash" out of "Attributes['multiplayer.issue.hash']" -
// used by the aggregation pipeline to know which Attributes[].key to pull a group-by/
// countDistinct dimension's value from.
export const extractAttributeKey = (fieldExpression: string): string => {
  const match = fieldExpression.match(ATTRIBUTE_KEY_PATTERN)

  if (!match) {
    throw new Error(`Expected an Attributes['<key>'] expression, got: ${fieldExpression}`)
  }

  return match[1]
}
