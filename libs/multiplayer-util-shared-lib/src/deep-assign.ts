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
