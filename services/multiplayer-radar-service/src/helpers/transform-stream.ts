import { Transform } from 'stream'

export const transformClickhouseStream = (cursor?) => {
  let firstPush = true

  const transformStream = new Transform({
    // objectMode: false,
    // readableObjectMode: true,
    writableObjectMode: true,
    autoDestroy: true,
    transform(chunks, encoding, callback) {
      if (firstPush) {
        this.push('{"data": [')
      }

      chunks
        .map((row, index: number) => {
          if (index > 0 || !firstPush) {
            this.push(',')
          }

          this.push(row.text)


        })

      firstPush = false

      return callback()
    },
    flush(callback) {
      if (firstPush) {
        this.push('{"data": [')
      }

      if (cursor) {
        this.push(`], "cursor": ${JSON.stringify(cursor)}}`)
      } else {
        this.push(']}')
      }

      return callback()
    },
  })

  return transformStream
}
