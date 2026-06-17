import type { Request, Response, NextFunction } from 'express'
import { AxiosError, fetch } from '@multiplayer/fetch'

export default async (req: Request, res: Response, next: NextFunction) => {
  const {
    method,
    url,
    headers,
    params,
    data,
  } = req.body
  let startTime: number | undefined = undefined
  try {
    let requestData = data

    const contentType = headers['content-type'] || headers['Content-Type']
    if (contentType && contentType === 'multipart/form-data' && data) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, (typeof value === 'string') ? value : JSON.stringify(value))
      })
      requestData = formData
    }

    // const userAgent = headers['User-Agent']
    //   || headers['user-agent']
    //   || DEFAULT_PROXY_USER_AGENT

    // delete headers['User-Agent']
    // delete headers['user-agent']

    const newHeaders = {
      ...(headers || {}),
      'x-proxy-req': true,
    }

    startTime = Date.now()
    const response = await fetch({
      maxContentLength: 1024 * 1024, // 1MB
      method,
      url,
      headers: newHeaders,
      params: params || {},
      data: requestData || {},
    })
    const duration = Date.now() - startTime

    return res.status(200).json({
      data: Buffer.from(JSON.stringify(response.data)).toString('base64'),
      statusText: response.statusText,
      status: response.status,
      headers: response.headers,
      success: true,
      duration,
    })
  } catch (error: any) {
    const duration = startTime ? Date.now() - startTime : 0
    if (error instanceof AxiosError) {
      if (error.code === 'ERR_BAD_RESPONSE' || error.message.includes('maxContentLength')) {
        return res.status(200).json({
          success: false,
          statusText: 'Response size is bigger than allowed (<=1MB)',
          status: 413,
          duration,
        })
      }
      const response = (error as AxiosError)?.response
      if (!response) {
        return (error.message && error.status) ? res.status(200).json({
          success: false,
          statusText: error.message,
          status: error.status,
          duration,
        }): res.status(200).json({
          success: false,
          statusText: error.message,
          status: 500,
          duration,
        })
      }
      return res.status(200).json({
        success: false,
        data: Buffer.from(JSON.stringify(response.data)).toString('base64'),
        statusText: response.statusText,
        status: response.status,
        headers: response.headers,
        duration,
      })
    }
    return next(error)
  }
}
