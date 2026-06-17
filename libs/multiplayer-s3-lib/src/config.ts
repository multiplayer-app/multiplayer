export const S3_HOST = process.env.S3_HOST || 'https://s3.amazonaws.com'
export const S3_EXPORT_HOST = process.env.S3_EXPORT_HOST || S3_HOST
export const S3_PRESIGNED_URL_EXPIRES = Number(process.env.S3_PRESIGNED_URL_EXPIRES) || 120

export const AWS_REGION = process.env.AWS_REGION as string
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string
