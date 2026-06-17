import { logger } from './logger'

export default function (
  target: any,
  methodName: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    const start = Date.now()
    try {
      return originalMethod.apply(this, args)
    } catch (error) {
      logger.error(`Error in method ${methodName}:`, error)
      throw error
    } finally {
      const time = Date.now() - start
      if (time > 500) logger.info(`method ${methodName} took more than 500ms`, time)
    }
  }

  return descriptor
}
