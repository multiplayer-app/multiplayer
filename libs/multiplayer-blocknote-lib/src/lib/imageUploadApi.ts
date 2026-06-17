export class ImageUploadApi {
  public static uploadImage = (file): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener(
        'load',
        () => {
          this.compress({ src: reader.result, type: file.type })
            .then(compressedSrc => {
              if (new Blob([compressedSrc]).size > 2 * 1024 * 1024) {
                throw new Error('Asset is bigger than 2MB, it will not be saved')
              }
              resolve(compressedSrc)
            })
            .catch(reject)
        },
        false,
      )

      reader.addEventListener('error', () => {
        reject(new Error('Failed to read the file'))
      })

      if (file) {
        reader.readAsDataURL(file)
      }
    })
  }

  private static compress = async (props: any): Promise<string> => {
    if (!props.type) return ''
    if (props.type.startsWith('image')) {
      return await this.compressImage(props)
    }
    return props.src
  }

  private static compressImage = async (props: { type: string; src: string }): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const width = image.width
        const height = image.height
        const maxSize = 0.25 * 1024 * 1024 // Convert MB to bytes

        let scaleFactor = 1
        if (width * height > maxSize) {
          scaleFactor = Math.sqrt(maxSize / (width * height))
        }

        canvas.width = width * scaleFactor
        canvas.height = height * scaleFactor

        ctx?.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL(props.type))
      }
      image.onerror = () => {
        reject(new Error('Failed to load the image'))
      }
      image.src = props.src
    })
  }
}

export default ImageUploadApi
