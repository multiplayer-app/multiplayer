export const isGzipString = (string: string) => {
  if (!string || string.length < 3) {
    return false
  }

  return string.startsWith('1f8b08')
}

export const isGzipBuffer = (buf: Buffer | Uint8Array) => {
  if (!buf || buf.length < 3) {
    return false
  }

  return buf[0] === 0x1F && buf[1] === 0x8B && buf[2] === 0x08
}
