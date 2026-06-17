// import { FilterQuery, Condition } from './types'

const setCharAt = (
  str: string,
  index: number,
  chr: string,
) => {
  if (index > str.length - 1) {
    return str
  }

  return str.substring(0, index) + chr + str.substring(index + 1)
}

const getLogicalOperator = (conditions: string, operator?: 'OR' | 'AND') => {
  if (!conditions.length) {
    return ''
  }

  if (operator) {
    return ` ${operator} `
  }

  return ' AND '
}

const buildFilterForSingleKey = (
  key: string,
  value: any,
): string => {
  if (!value && typeof value !== 'boolean') {
    return ''
  }

  if (Array.isArray(value)) {
    let filterValue = JSON.stringify(value).replace(/"/g, '\'')
    filterValue = setCharAt(filterValue, 0, '(')
    filterValue = setCharAt(filterValue, filterValue.length - 1, ')')

    return `${key} IN ${filterValue}`
  } else if (value.$in) {
    let filterValue = JSON.stringify(value.$in).replace(/"/g, '\'')
    filterValue = setCharAt(filterValue, 0, '(')
    filterValue = setCharAt(filterValue, filterValue.length - 1, ')')

    return `${key} IN ${filterValue}`
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
        // _conditions += ` ${getLogicalOperator(_conditions, operator)} `

        let conditions = '('
        value.$like.forEach((value, i) => {
          conditions += `${i > 0 ? ' OR ' : ''} ilike(${key}, '%${value}%')`
        })
        conditions += ')'

        return conditions
      } else {
        return `ilike(${key}, '%${value.$like}%')`
      }
    }

    if (value.$exists) {
      return `${key} ${value.$exists ? 'IS NOT NULL' : 'IS NULL'}`
    }

    if (value.$gt || value.$gte || value.$lt || value.$lte) {
      let _filter = ''
      if (value.$gt) {
        if (value.$gt.$date) {
          _filter += `${key} > parseDateTimeBestEffortOrNull('${new Date(value.$gt.$date).toISOString()}')`
        } else {
          _filter += `${key} > '${value.$gt}'`
        }
      }

      if (value.$gte) {
        if (value.$gte.$date) {
          _filter += `${getLogicalOperator(_filter)} ${key} >= parseDateTimeBestEffortOrNull('${new Date(value.$gte.$date).toISOString()}')`
        } else {
          _filter += `${getLogicalOperator(_filter)}  ${key} >= '${value.$gte}'`
        }
      }

      if (value.$lt) {
        if (value.$lt.$date) {
          _filter += `${getLogicalOperator(_filter)} ${key} < parseDateTimeBestEffortOrNull('${new Date(value.$lt.$date).toISOString()}')`
        } else {
          _filter += `${getLogicalOperator(_filter)} ${key} < '${value.$lt}'`
        }
      }

      if (value.$lte) {
        if (value.$lte.$date) {
          _filter += `${getLogicalOperator(_filter)} ${key} <= parseDateTimeBestEffortOrNull('${new Date(value.$lte.$date).toISOString()}')`
        } else {
          _filter += `${getLogicalOperator(_filter)} ${key} <= '${value.$lte}'`
        }
      }

      return `(${_filter})`
    }

    if (typeof value === 'object' && '$not' in value) {
      if (value?.$not === null) {
        return `isNotNull(${key}) AND notEmpty(${key})`
      } else {
        return `${key} != '${value.$not}'`
      }
    }

    if (
      typeof value === 'object'
      && value?.$columnType === 'array'
      && Array.isArray(value?.$value)
    ) {
      const filterValue = JSON.stringify(value?.$value).replace(/"/g, '\'')
      return `notEmpty(arrayIntersect(${key}, ${filterValue}))`
    }

    if (value.$or?.length) {
      return `(${value.$or.map(_value => `${key} = '${_value}'`).join(' OR ')}) `
    }

    if (value.$intersects) {
      return `notEmpty(arrayIntersect(${key}, ${JSON.stringify(value.$intersects).replace(/"/g, '\'')}))`
    }

    if (value.$arrayExists) {
      return value.$arrayExists.map(arrayEntry => {
        const keys = Object.keys(arrayEntry)

        return `arrayExists(x -> ${keys.map(_key => `x.${_key} = '${arrayEntry[_key]}'`).join(' AND ')}, ${key})`
      }).join(' AND ')
    }
  }

  return ''
}

/**
 *
 * @example
 * {
 *   name: { $like: "api" }
 * }
 */
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

/**
 *
 * @example
 * {
 *   name: { $like: "api" }
 * }
 */
export const buildReplace = (replace: object): string => {
  const replaceString: string[] = []

  for (const key in replaceString) {
    replaceString.push(`${replaceString[key]} as ${key}`)
  }

  return replaceString.join(', ')
}
