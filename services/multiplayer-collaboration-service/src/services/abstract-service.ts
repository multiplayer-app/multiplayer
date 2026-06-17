import logger from '@multiplayer/logger'
import {
  fetch,
  fetchRetry,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type IAxiosRetryConfig,
} from '@multiplayer/fetch'
import { prometheusClient } from '../prometheus'

export abstract class AbstractService {
  protected instance: AxiosInstance

  constructor(sessionCookie = '') {
    this.instance = fetch.create({
      baseURL: this.getBaseUrl(),
      withCredentials: true,
    })
    const retryConfigs: IAxiosRetryConfig = {
      retries: 8,
      retryDelay: fetchRetry.exponentialDelay,
      onRetry: (retryCount, error, config) => {
        logger.debug(`retry(${retryCount}) ${config.method}: ${config.baseURL}${config.url}`)
        prometheusClient.updateRetryCounter(this.getBaseUrl())
      },
    }
    fetchRetry(this.instance, retryConfigs)
    this.instance.defaults.headers.Cookie = sessionCookie

    this.instance.interceptors.response.use(
      (response) => response?.data,
      (error) => {
        const path = error?.request?.path || ''
        const _error = this.getParsedError(error?.response?.data) || error

        const wrappedError = {
          message: `Failed API request to ${path}`,
          error: _error,
        }
        if (error.status >= 500) {
          logger.error(wrappedError)
        } else {
          logger.info(wrappedError)
        }
        return Promise.reject(_error)
      },
    )
    this.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      logger.info(`${config.method}: ${config.baseURL}${config.url}`)
      return config
    })
  }

  private getParsedError (error: any) {
    try {
      if (typeof error === 'string') {
        return JSON.parse(error)
      }
      return error
    } catch (err) {
      return undefined
    }
  }

  protected abstract getBaseUrl(): string;
}
