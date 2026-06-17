import * as zlib from 'zlib'

export const uncompressHexString = async (bufferAsHexString: string): Promise<Buffer> => {
  const dezippedBuffer = await new Promise((resolve) => zlib
    .gunzip(
      Buffer.from(bufferAsHexString, 'hex'),
      function(err, dezipped) {
        if (err) {
          return resolve(Buffer.from(''))
        } else {
          return resolve(dezipped)
        }
      },
    ),
  ) as Buffer

  return dezippedBuffer
}
