import { Notebook } from '@multiplayer/types'

export function dataCollector(
  attributes: Notebook.RestApiBlockAttributes,
  resolveVariable: (key: string) => string,
): {
  data: any
  url: string
  method: Notebook.HttpMethodEnum
  params: Record<string, string>
  headers: Record<string, string>
} {
  const { url, body, method, authorization, headers, parameters } = JSON.parse(JSON.stringify(attributes))

  const reqParams = buildParameters(parameters, authorization, resolveVariable)
  const reqHeaders = buildHeaders(headers, authorization, resolveVariable)
  const reqBody = buildRequestBody(body, reqHeaders, resolveVariable)
  const reqUrl = buildUrl(url.trim(), resolveVariable)

  return {
    method,
    url: reqUrl,
    data: reqBody,
    params: reqParams,
    headers: reqHeaders,
  }
}

// Build URL without query parameters
function buildUrl(baseUrl: string, resolveVariable: (key: string) => string): string {
  const resolvedUrl = resolveVariable(baseUrl.split('?')[0])
  return resolvedUrl
}

// Build headers and handle authorization
function buildHeaders(
  headers: Array<{ key: string; value: string }>,
  authorization: Notebook.RestApiBlockAttributes['authorization'],
  resolveVariable: (key: string) => string,
): Record<string, string> {
  const reqHeaders: Record<string, string> = {}

  headers.forEach(({ key, value }) => {
    if (key && value) {
      reqHeaders[resolveVariable(key)] = resolveVariable(value)
    }
  })

  handleAuthorization(authorization, reqHeaders, resolveVariable)

  return reqHeaders
}

// Handle authorization and modify headers or parameters accordingly
function handleAuthorization(
  authorization: Notebook.RestApiBlockAttributes['authorization'],
  headers: Record<string, string>,
  resolveVariable: (key: string) => string,
): void {
  if (authorization.type === Notebook.AuthorizationType.NONE) return

  switch (authorization.type) {
    case Notebook.AuthorizationType.BASIC: {
      const { username, password } = authorization[Notebook.AuthorizationType.BASIC]!
      headers['Authorization'] = `Basic ${btoa(`${resolveVariable(username)}:${resolveVariable(password)}`)}`
      break
    }
    case Notebook.AuthorizationType.BEARER_TOKEN: {
      headers['Authorization'] =
        `Bearer ${resolveVariable(authorization[Notebook.AuthorizationType.BEARER_TOKEN]!.token)}`
      break
    }
    case Notebook.AuthorizationType.API_KEY: {
      const apiKeyAuth = authorization[Notebook.AuthorizationType.API_KEY]!
      const resolvedKey = resolveVariable(apiKeyAuth.key)
      const resolvedValue = resolveVariable(apiKeyAuth.value)
      if (resolvedKey && apiKeyAuth.addTo === Notebook.AuthorizationAddTo.HEADER) {
        headers[resolvedKey] = resolvedValue
      }
      break
    }
    // case Notebook.AuthorizationType.JWT_BEARER: {
    //   const jwtAuth = authorization[Notebook.AuthorizationType.JWT_BEARER]!
    //   const token = createJwtToken(jwtAuth, resolveVariable)
    //   if (jwtAuth.addTo === Notebook.AuthorizationAddTo.HEADER) {
    //     headers['Authorization'] = `${jwtAuth.requestHeaderPrefix} ${token}`
    //   }
    //   break
    // }
  }
}

// Build parameters, resolving variables
function buildParameters(
  parameters: Array<{ key: string; value: string }>,
  authorization: Notebook.RestApiBlockAttributes['authorization'],
  resolveVariable: (key: string) => string,
): Record<string, string> {
  const reqParams: Record<string, string> = {}

  parameters.forEach(({ key, value }) => {
    if (key) {
      reqParams[resolveVariable(key)] = resolveVariable(value)
    }
  })

  handleAuthorizationParameters(authorization, reqParams, resolveVariable)

  return reqParams
}

// Handle authorization parameters (e.g., API key or JWT in query)
function handleAuthorizationParameters(
  authorization: Notebook.RestApiBlockAttributes['authorization'],
  parameters: Record<string, string>,
  resolveVariable: (key: string) => string,
): void {
  if (authorization.type === Notebook.AuthorizationType.NONE) return

  switch (authorization.type) {
    case Notebook.AuthorizationType.API_KEY: {
      const apiKeyAuth = authorization[Notebook.AuthorizationType.API_KEY]!
      if (apiKeyAuth.addTo === Notebook.AuthorizationAddTo.QUERY) {
        const resolvedKey = resolveVariable(apiKeyAuth.key)
        const resolvedValue = resolveVariable(apiKeyAuth.value)
        parameters[resolvedKey] = resolvedValue
      }
      break
    }
    // case Notebook.AuthorizationType.JWT_BEARER: {
    //   const jwtAuth = authorization[Notebook.AuthorizationType.JWT_BEARER]!
    //   const token = createJwtToken(jwtAuth, resolveVariable)
    //   if (jwtAuth.addTo === AuthorizationAddTo.QUERY) {
    //     parameters[jwtAuth.requestHeaderPrefix] = token
    //   }
    //   break
    // }
  }
}

// Build request body based on the body type
function buildRequestBody(
  body: Notebook.RestApiBlockAttributes['body'],
  headers: Record<string, string>,
  resolveVariable: (key: string) => string,
): any {
  if (body.type === Notebook.BodyType.NONE) return null

  try {
    switch (body.type) {
      case Notebook.BodyType.RAW: {
        const rawContent = body[Notebook.BodyType.RAW]
        if (!rawContent) return ''
        const resolvedValue = resolveVariable(rawContent.value)
        switch (rawContent.type) {
          case Notebook.RawContentLang.JSON:
            headers['Content-Type'] = 'application/json'
            return JSON.parse(resolvedValue)
          case Notebook.RawContentLang.XML:
            headers['Content-Type'] = 'application/xml'
            return resolvedValue
          case Notebook.RawContentLang.HTML:
            headers['Content-Type'] = 'text/html'
            return resolvedValue
          case Notebook.RawContentLang.JAVASCRIPT:
            headers['Content-Type'] = 'application/javascript'
            return resolvedValue
          default:
            headers['Content-Type'] = 'text/plain'
            return resolvedValue
        }
      }
      case Notebook.BodyType.FORM_DATA: {
        // const formData = new FormData()
        // body[BodyType.FORM_DATA]?.forEach(({ key, value, type }) => {
        //   if (key) {
        //     if (type === FormDataPropertyType.FILE && value instanceof File) {
        //       formData.append(resolveVariable(key), value)
        //     } else {
        //       formData.append(resolveVariable(key), resolveVariable(value.toString()))
        //     }
        //   }
        // })

        // Send formData as json object to convert it to actual FormData proxy service side
        const formData: Record<string, string | Notebook.FileType> = {}
        body[Notebook.BodyType.FORM_DATA]?.forEach(({ key, value, type }) => {
          if (key && type !== Notebook.FormDataPropertyType.FILE) {
            formData[resolveVariable(key)] = typeof value === 'string' ? resolveVariable(value) : value
          }
        })
        headers['Content-Type'] = 'multipart/form-data'

        return formData
      }
      case Notebook.BodyType.URL_ENCODED: {
        const urlEncoded = new URLSearchParams()
        body[Notebook.BodyType.URL_ENCODED]?.forEach(({ key, value }) => {
          if (key) {
            urlEncoded.append(resolveVariable(key), resolveVariable(value))
          }
        })
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
        return urlEncoded.toString()
      }
      case Notebook.BodyType.BINARY: {
        return resolveVariable(body[Notebook.BodyType.BINARY]?.base64 || '')
      }
      default:
        return null
    }
  } catch (err) {
    throw new Error('Body Content is invalid')
  }
}

// // JWT Token Creation Utility
// function createJwtToken(jwtAuth: AuthorizationJWTBearer, resolveVariable: (key: string) => string): string {
//   const { secret, algorithm, payload, jwtHeaders, secretEncoded } = jwtAuth
//   const signingKey = secretEncoded ? Buffer.from(resolveVariable(secret), 'base64') : resolveVariable(secret)

//   return jwt.sign(payload, signingKey, {
//     algorithm: algorithm as jwt.Algorithm,
//     header: jwtHeaders,
//   })
// }
