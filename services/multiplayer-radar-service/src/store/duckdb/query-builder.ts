// DuckDB port of libs/multiplayer-clickhouse-lib/src/query-builder.ts. Same filter
// operator surface (FilterQuery from '../types', reused unchanged from ClickHouse - the
// shape of a filter object doesn't depend on which engine executes it), translated to
// DuckDB SQL syntax. See the Phase 2 plan for the full ClickHouse -> DuckDB operator
// mapping table this was written against.

const setCharAt = (str: string, index: number, chr: string) => {
  if (index > str.length - 1) {
    return str
  }

  return str.substring(0, index) + chr + str.substring(index + 1)
}

const getLogicalOperator = (conditions: string, operator?: 'OR' | 'AND') => {
  if (!conditions.length) {
    return ''
  }

  return operator ? ` ${operator} ` : ' AND '
}

const toSqlList = (values: any[]): string => {
  let filterValue = JSON.stringify(values).replace(/"/g, '\'')
  filterValue = setCharAt(filterValue, 0, '(')
  filterValue = setCharAt(filterValue, filterValue.length - 1, ')')

  return filterValue
}

const toSqlArrayLiteral = (values: any[]): string => JSON.stringify(values).replace(/"/g, '\'')

const buildFilterForSingleKey = (key: string, value: any): string => {
  if (!value && typeof value !== 'boolean') {
    return ''
  }

  if (Array.isArray(value)) {
    return `${key} IN ${toSqlList(value)}`
  } else if (value.$in) {
    return `${key} IN ${toSqlList(value.$in)}`
  } else {
    if (typeof value === 'boolean') {
      return `${key} = ${value}`
    } else if (typeof value === 'string') {
      return `${key} = '${value}'`
    } else if (typeof value === 'number') {
      return `${key} = ${value}`
    }

    if (value.$like) {
      if (Array.isArray(value.$like)) {
        let conditions = '('
        value.$like.forEach((v, i) => {
          conditions += `${i > 0 ? ' OR ' : ''} ${key} ILIKE '%${v}%'`
        })
        conditions += ')'

        return conditions
      } else {
        return `${key} ILIKE '%${value.$like}%'`
      }
    }

    if (value.$exists) {
      return `${key} ${value.$exists ? 'IS NOT NULL' : 'IS NULL'}`
    }

    if (value.$gt || value.$gte || value.$lt || value.$lte) {
      let _filter = ''
      if (value.$gt) {
        _filter += value.$gt.$date
          ? `${key} > CAST('${new Date(value.$gt.$date).toISOString()}' AS TIMESTAMP)`
          : `${key} > '${value.$gt}'`
      }

      if (value.$gte) {
        _filter += value.$gte.$date
          ? `${getLogicalOperator(_filter)} ${key} >= CAST('${new Date(value.$gte.$date).toISOString()}' AS TIMESTAMP)`
          : `${getLogicalOperator(_filter)}  ${key} >= '${value.$gte}'`
      }

      if (value.$lt) {
        _filter += value.$lt.$date
          ? `${getLogicalOperator(_filter)} ${key} < CAST('${new Date(value.$lt.$date).toISOString()}' AS TIMESTAMP)`
          : `${getLogicalOperator(_filter)} ${key} < '${value.$lt}'`
      }

      if (value.$lte) {
        _filter += value.$lte.$date
          ? `${getLogicalOperator(_filter)} ${key} <= CAST('${new Date(value.$lte.$date).toISOString()}' AS TIMESTAMP)`
          : `${getLogicalOperator(_filter)} ${key} <= '${value.$lte}'`
      }

      return `(${_filter})`
    }

    if (typeof value === 'object' && '$not' in value) {
      return value?.$not === null
        ? `${key} IS NOT NULL AND ${key} != ''`
        : `${key} != '${value.$not}'`
    }

    if (
      typeof value === 'object'
      && value?.$columnType === 'array'
      && Array.isArray(value?.$value)
    ) {
      return `len(list_intersect(${key}, ${toSqlArrayLiteral(value.$value)})) > 0`
    }

    if (value.$or?.length) {
      return `(${value.$or.map(_value => `${key} = '${_value}'`).join(' OR ')}) `
    }

    if (value.$intersects) {
      return `len(list_intersect(${key}, ${toSqlArrayLiteral(value.$intersects)})) > 0`
    }

    if (value.$arrayExists) {
      // tags is STRUCT(key VARCHAR, value VARCHAR)[] here (named fields), not a bare
      // tuple like ClickHouse's Array(Tuple(String, String)) - arrayEntry's numeric
      // keys ('1'/'2', see FilterQuery's $arrayExists shape) map onto struct field
      // names in that same key->value order.
      return value.$arrayExists.map(arrayEntry => {
        const keys = Object.keys(arrayEntry)
        const fieldNames = ['key', 'value']

        return `len(list_filter(${key}, x -> ${
          keys.map((_key, i) => `x.${fieldNames[i]} = '${arrayEntry[_key]}'`).join(' AND ')
        })) > 0`
      }).join(' AND ')
    }
  }

  return ''
}

export const buildFilter = (filter: object): string => {
  let conditions: string = ''

  for (const key in filter) {
    if (key === '$or' && Array.isArray(filter[key])) {
      conditions += ` ${getLogicalOperator(conditions)} (`

      let i = 0
      for (const orFilter of filter[key]) {
        for (const orKey in orFilter) {
          if (i > 0) {
            conditions += ` ${getLogicalOperator(conditions, 'OR')}`
          }

          conditions += ` ${buildFilterForSingleKey(orKey, orFilter[orKey])}`
        }

        i++
      }

      conditions += ')'
    } else {
      conditions += ` ${getLogicalOperator(conditions)} `
      conditions += ` ${buildFilterForSingleKey(key, filter[key])}`
    }
  }

  return conditions
}
