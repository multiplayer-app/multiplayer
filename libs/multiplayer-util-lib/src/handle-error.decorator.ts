export function handleError(handler: (target: any, methodName: string, err: unknown, args: any[]) => void) {
  return function(target: any, methodName: string, descriptor: PropertyDescriptor) {
    const originalFunction = descriptor.value

    descriptor.value = async function(...args) {
      try {
        return await originalFunction.apply(this, args)
      } catch (err) {
        handler(target, methodName, err, args)
      }
    }

    return descriptor
  }
}
