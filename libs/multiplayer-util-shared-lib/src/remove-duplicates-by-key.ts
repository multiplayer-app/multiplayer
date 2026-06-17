export default <T>(arr: T[], key: string): T[] => {
  if (!Array.isArray(arr)) {
    return arr
  }

  const keysSet = new Set()

  return arr.filter((item) => {
    if (!keysSet.has(item[key])) {
      keysSet.add(item[key])
      return true
    }

    return false
  })
}
