import axios from 'axios'
import axiosRetry, { AxiosRetry } from 'axios-retry'
import safeJsonStringify from 'json-stringify-safe'
import logger from '@multiplayer/logger'
export {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
export type { IAxiosRetryConfig } from 'axios-retry'
import { DEFAULT_FETCH_USER_AGENT } from './config'

const getParsedResponseData = (data: any) => {
  if (typeof data !== 'string') {
    return data
  }
  try {
    return JSON.parse(data)
  } catch (err) {
    return data
  }
}

axios.defaults.headers.common['User-Agent'] = DEFAULT_FETCH_USER_AGENT

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const method = error?.request?.method
    const path = error?.request?.path || ''

    const errorStringified = safeJsonStringify(error)

    const message = `Failed API request to ${method} ${path}`

    logger.warn(
      {
        errorStringified,
      },
      message,
    )

    return Promise.reject(error)
  },
)

export const fetch = axios

export const fetchRetry = axiosRetry as AxiosRetry
