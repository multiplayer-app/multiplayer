import { fetch } from '@multiplayer/fetch'
import safeJsonStringify from 'json-stringify-safe'

fetch.interceptors.response.clear()

fetch.interceptors.response.use(
  (response) => response,
  (error) => {
    const method = error?.request?.method
    const path = error?.request?.path || ''
    let _error

    if (error?.response?.data) {
      if (
        error?.response?.data?.statusMessage
        || error?.response?.data?.error_description
      ) {
        _error = {
          code: error.code,
          statusMessage: error?.response?.data.error_description,
          message: error.message,
        }
      } else {
        _error = {
          data: error?.response?.data,
        }
      }
    } else {
      _error = error
    }

    _error.status = error?.response?.status

    const errorStringified = safeJsonStringify(_error)

    const message = `Failed API request to ${method} ${path} error: ${errorStringified}`

    const wrappedError = new Error(message) as any
    wrappedError.response = _error

    return Promise.reject(wrappedError)
  },
)

export default fetch
