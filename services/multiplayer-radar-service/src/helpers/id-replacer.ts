export default (str: string | undefined): string | undefined => {
  if (!str) {
    return str
  }

  let i = 0

  return str.replace(
    /([0-9a-fA-F]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g,
    function () {
      i++
      return `{id${i}}`
    },
  )
}
