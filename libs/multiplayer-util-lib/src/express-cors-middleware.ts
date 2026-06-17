import cors from 'cors'

const TRACE_HEADER_NAME = 'Traceparent'

interface CorsOptions {
  corsDomain?: string | boolean,
  allowedHeaders?: string[],
  exposedHeaders?: string[],
  credentials?: boolean | undefined
}

export const corsMiddlewareOptions = (options?: CorsOptions) => {
  const { corsDomain, allowedHeaders, exposedHeaders } = options || {}
  const _allowedHeaders = [
    'Cookie',
    'Content-Type',
    ...(allowedHeaders || []),
    TRACE_HEADER_NAME,
  ]

  let _credentials: boolean | undefined = true

  if (
    'credentials' in (options || {})
  ) {
    _credentials = options?.credentials
  }

  let origin

  if (typeof corsDomain === 'boolean' || corsDomain === '*') {
    origin = corsDomain
  } else if (typeof corsDomain === 'string') {
    origin = corsDomain.split(',')
  }

  const corsOptions = {
    origin,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    credentials: _credentials,
    ..._allowedHeaders?.length
      ? { allowedHeaders: _allowedHeaders }
      : {},
    ...exposedHeaders?.length
      ? { exposedHeaders }
      : {},
  }

  return corsOptions
}

export const corsMiddleware = (options?: CorsOptions) => {
  const corsOptions = corsMiddlewareOptions(options)

  return cors(corsOptions)
}
