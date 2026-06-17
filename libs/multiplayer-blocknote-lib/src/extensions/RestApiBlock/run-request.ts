// import jwt from 'jsonwebtoken'

import { Notebook } from '@multiplayer/types'
import { dataCollector } from './data-collector'

export async function runApiRequestWithDetails(
  attributes: Notebook.RestApiBlockAttributes,
  variablesResolver,
): Promise<any> {
  const { url, method, headers, data } = dataCollector(attributes, variablesResolver)

  const startTime = performance.now() // Track start time
  // Perform request
  const response = await fetch(url, {
    method,
    headers,
    body: method === Notebook.HttpMethodEnum.GET || method === Notebook.HttpMethodEnum.HEAD ? undefined : data,
  })

  const endTime = performance.now() // Track end time

  // Parse headers
  const responseHeaders: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  // Get the response body
  const contentType = response.headers.get('Content-Type') || ''
  let parsedBody: any
  let rawBody: string

  try {
    if (contentType.includes('application/json')) {
      rawBody = await response.text()
      parsedBody = JSON.parse(rawBody)
    } else {
      parsedBody = await response.text()
      rawBody = parsedBody
    }
  } catch (error) {
    rawBody = await response.text()
    parsedBody = rawBody // Keep raw text if parsing fails
  }

  const size = rawBody.length

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body: parsedBody,
    rawBody,
    size,
    timeTaken: (endTime - startTime).toFixed(2) + ' ms',
  }
}
