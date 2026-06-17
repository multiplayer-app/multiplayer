export type WSCallback<T> = (data: CallbackData<T>) => void

export type CallbackData<T> = {
  error?: { status?: number, message?: string }
  data?: T
}
