export const getNestedProperty = <T>(
  obj: any,
  keys: string | string[],
  defaultValue?: T | undefined,
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
