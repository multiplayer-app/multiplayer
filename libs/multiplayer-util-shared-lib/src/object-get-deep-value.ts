export default (obj: object, path: string): any => {
  const props = path.split('.')

  for (let i = 0; i < props.length; i++) {
    if (!obj) {
      return false
    }

    obj = obj[props[i]]
  }

  return obj
}
