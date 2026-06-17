export default (tag: string) => {
  const parts = tag.split(':')
  if (parts.length > 1) {
    return {
      ...(parts[0] && { key: parts[0] }),
      value: tag.slice(parts[0].length + 1),
    }
  }

  return { value: tag }
}