export default (tag: string) => {
  if (!tag) {
    return ''
  }
  // Remove non-letter characters from the start until it starts with a letter
  const match = tag.match(/[a-zA-Z].*/)
  if (!match) {
    return ''
  }
  tag = match[0]

  // Replace invalid characters with underscores
  tag = tag.replace(/[^a-zA-Z0-9_\-:./]/g, '_')

  // Reduce contiguous colons to a single colon
  tag = tag.replace(/:+/, ':')

  // Remove trailing underscores
  tag = tag.replace(/_+$/, '')

  // Reduce contiguous underscores to a single underscore
  tag = tag.replace(/_+/g, '_')

  // Convert to lowercase
  tag = tag.toLowerCase()

  // Truncate to 200 characters
  if (tag.length > 200) {
    tag = tag.substring(0, 200)
    // Ensure we don't end with an underscore after truncation
    tag = tag.replace(/_+$/, '')
  }

  return tag
}