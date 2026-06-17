export interface SocketError extends Error {
  message: string
  data?: {
    code: number
  }
}

export class SocketIOError extends Error implements SocketError {
  public data: { code: number }

  constructor(message: string, code: number) {
    super(message)
    this.data = { code }
  }
}
