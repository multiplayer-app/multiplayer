import multer from 'multer'
import util from 'util'
import type { Request, Response, NextFunction } from 'express'

const storage = {
  memory: multer.memoryStorage(),
}

const fileFilter = mimeTypes => (req: Request, file, cb) => {
  if (mimeTypes.includes(file.mimetype)) {
    return cb(null, true)
  }
  return cb('invalid file type', false)
}

export default (
  fieldName: string,
  mimeTypes: string[],
  filesNumber: number = 1,
): (req: Request, res: Response, next: NextFunction) => any => {
  const _multer = multer({
    storage: storage.memory,
    fileFilter: fileFilter(mimeTypes),
  })

  return util.promisify(
    filesNumber === 1
      ? _multer.single(fieldName)
      : _multer.array(fieldName, filesNumber),
  )
}
