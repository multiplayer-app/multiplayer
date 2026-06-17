export interface ProxyRequest {
  method: string
  url: string
  headers?: Record<string, string>
  params?: Record<string, string>
  data?: any
}

export interface ProxyResponse {
  success: boolean
  statusText: string
  status: number
  duration: number
  data?: string
  headers?: Record<string, string>
}