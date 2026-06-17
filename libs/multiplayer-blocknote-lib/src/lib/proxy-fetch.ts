import { Notebook } from '@multiplayer/types'

interface ProxyFetchOptions {
  method: Notebook.HttpMethodEnum
  headers?: Record<string, string>
  body?: any
  params?: Record<string, string>
  signal?: AbortSignal
}

interface ProxyConfig {
  apiInstance?: any
  path: string
}

export async function proxyFetch(url: string, options: ProxyFetchOptions, proxy: ProxyConfig): Promise<Response> {
  if (!proxy) {
    throw new Error('Proxy configuration is missing')
  }

  const { apiInstance, path } = proxy
  const requestData = {
    url,
    method: options.method,
    headers: options.headers || {},
    data: options.body,
    params: options.params || {},
  }

  try {
    let response
    if (apiInstance) {
      response = await apiInstance.post(path, requestData, { signal: options.signal })
    } else if (typeof fetch === 'function') {
      response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: options.signal,
      })
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      response = await response.json()
    } else {
      throw new Error('No valid proxy API instance or fetch available')
    }

    // Convert the proxy response to a Response object
    return new Response(atob(response.data), {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    })
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request canceled')
    }
    throw error
  }
}

// Helper function to create a proxy fetch instance with a specific proxy config
export function createProxyFetch(proxy: ProxyConfig) {
  return (url: string, options: ProxyFetchOptions) => proxyFetch(url, options, proxy)
}
