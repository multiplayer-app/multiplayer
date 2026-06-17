/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
const isObject = (item) => {
  return (item && typeof item === 'object' && !Array.isArray(item))
}

const setTimestampToSchema = (object): object => {
  if (isObject(object) && isObject(object)) {

    if ('type' in object) {
      object.__timestamp = new Date().toISOString()
    }

    for (const key in object) {
      if (isObject(object[key])) {

        setTimestampToSchema(
          object[key],
        )
      }
    }
  }

  return object
}

export default setTimestampToSchema
