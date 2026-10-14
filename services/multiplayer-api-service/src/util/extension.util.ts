import mime from 'mime-types'
const TEXT_EXT = 'txt'

export function getExtensionFromUri(url: string) {
  const ext = url.split(/[#?]/)[0].split('.').pop()?.trim()
  const extRegex = /^[a-zA-Z0-9]{1,10}$/
  if (ext && extRegex.test(ext) && mime.lookup(ext)) {
    return ext
  }
  return undefined
}

export function getExtension(url: string, contentType: string = 'text/plain') {
  let extension = mime.extension(contentType) || TEXT_EXT
  if (extension === TEXT_EXT) {
    extension = getExtensionFromUri(url) || extension
  }
  return extension || TEXT_EXT
}