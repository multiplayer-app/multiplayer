import { YjsEntitiesSocketIO } from './yjs-entities-socket-io'

let instance: YjsEntitiesSocketIO | undefined

export const setYjsEntitiesSocketIO = (yjsEntitiesSocketIO: YjsEntitiesSocketIO): void => {
  instance = yjsEntitiesSocketIO
}

export const getYjsEntitiesSocketIO = (): YjsEntitiesSocketIO => {
  if (!instance) {
    throw new Error('YjsEntitiesSocketIO is not initialized yet')
  }

  return instance
}
