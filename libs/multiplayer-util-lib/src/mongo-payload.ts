export const prepareUpdateParams = (payload: object): { set: any, unset: any } => {
  return Object.keys(payload).reduce((acc, field) => {
    payload[field] === null
      ? acc.unset[field] = payload[field]
      : acc.set[field] = payload[field]

    return acc
  }, { set: {}, unset: {} })
}

export const flattenObject = (input: object, keyName?: string): object => {
  let result = {}
  for (const key in input) {
    const newKey = keyName ? `${keyName}.${key}` : key
    if (
      typeof input[key] === 'object'
      && !Array.isArray(input[key])
      && !((input[key] as any) instanceof Date)
    ) {
      result = { ...result, ...flattenObject(input[key], newKey) }
    } else {
      result[newKey] = input[key]
    }
  }
  return result
}

export const prependToKeys = (
  payload: object,
  text: string,
  addDot: boolean = true,
): object => {
  return Object.keys(payload).reduce((acc, field) => {
    acc[`${text}${addDot ? '.': ''}${field}`] = payload[field]

    return acc
  }, {})
}

export const removeUndefinedProps = <T extends object>(payload: T): Partial<T> => {
  return Object.keys(payload).reduce((acc, field) => {
    if (payload[field] !== undefined) {
      acc[field] = payload[field]
    }

    return acc
  }, {})
}

export const groupBySetUnset = (payload) => {
  return Object.keys(payload).reduce((acc, field) => {
    payload[field] === null || payload[field] === undefined
      ? acc.unset[field] = 1
      : acc.set[field] = payload[field]

    return acc
  }, { set: {}, unset: {} })
}
