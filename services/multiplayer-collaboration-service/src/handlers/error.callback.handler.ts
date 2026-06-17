import { CallbackData } from '@multiplayer/types'
import { AxiosError } from '@multiplayer/fetch'

export function requestErrorHandlerWithCallback(
  target: any,
  methodName: string,
  err: unknown,
  args: any[],
) {
  if (!args || !args.length || !(args[args.length - 1] instanceof Function)) {
    return
  }
  const callback = args[args.length - 1]
  const error = getProcessedError(err)
  callback({ error })
}


export function getProcessedError<T>(err: AxiosError | unknown): CallbackData<unknown>['error'] {
  if (err instanceof AxiosError) {
    return {
      status: (err as AxiosError).response?.status,
      message: (err as AxiosError).response?.statusText,
    }
  }

  return {
    status: (err as any)?.code || (err as any).statusCode || (err as any).status || 500,
    message: (err as any)?.message || (err as any).message || 'Internal error',
  }
}
