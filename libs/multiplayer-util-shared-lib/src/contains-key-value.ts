export const containsKeyValue = (obj: object, key: string, value: any) => {
  if (obj[key] === value) {
    return true
  }
  for (const _key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, _key)) {
      const item = obj[_key]
      if (typeof item === 'object' && item !== null) {
        if (containsKeyValue(item, key, value)) {
          return true
        }
      }
      if (Array.isArray(item)) {
        for (let i = 0; i < item.length; i++) {
          if (
            typeof item[i] === 'object' &&
            containsKeyValue(item[i], key, value)
          ) {
            return true
          }
        }
      }
    }
  }
  return false
}
