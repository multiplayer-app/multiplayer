export const getNestedProperty = <T>(
  obj: any,
  keys: string | string[],
  defaultValue?: T,
): T | undefined => {
  keys = Array.isArray(keys) ? keys : keys.split('.')
  for (let i = 0; i < keys.length; i++) {
    if (!obj || typeof obj !== 'object') {
      return defaultValue
    }
    obj = obj[keys[i]]
  }
  return obj !== undefined ? obj : defaultValue
}

export const deepAssign = (target: any, source: any): any => {
  const result = Array.isArray(target) ? [] : {}

  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      result[key] = target[key]
    }
  }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !(result[key] && typeof result[key] === 'object')
      ) {
        result[key] = Array.isArray(source[key]) ? [] : {}
      }

      if (result[key] && typeof result[key] === 'object') {
        result[key] = deepAssign(result[key], source[key])
      } else {
        result[key] = source[key]
      }
    }
  }
  return result
}

export const setNestedProperty = (
  obj: any,
  keys: string | string[],
  value: any,
): void => {
  keys = Array.isArray(keys) ? keys : keys.split('.')
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!obj[key] || typeof obj[key] !== 'object') {
      obj[key] = {}
    }
    obj = obj[key]
  }
  obj[keys[keys.length - 1]] = value
}

export const isObjectEmpty = (obj) => {
  return !obj || Object.keys(obj).length === 0
}
