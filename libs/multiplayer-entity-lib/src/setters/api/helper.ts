import * as Y from 'yjs'

export function setObjectsToMap<T>(type: string, map: Y.Map<any>, objectsMap?: Record<string,T>) {
  map.forEach((value, key) => {
    const [keyType, name] = key.split(':')
    if (keyType === type && !objectsMap?.[name]) {
      map.delete(key)
    }
  })
  Object.keys(objectsMap || {}).forEach((name) => {
    const object = objectsMap?.[name]
    if (!object) return
    map.set(`${type}:${name}`, object)
  })
}
