import connector from './connector'
import _listen from './listen'
import _ping from './ping'
import _publish from './publish'
import _request from './request'
import _bindQueue from './bind-queue'

export const connect = connector.tryConnect.bind(connector)
export const disconnect = connector.disconnect.bind(connector)
export const listen = _listen
export const ping = _ping
export const publish = _publish
export const request = _request
export const bindQueue = _bindQueue

export default {
  connect,
  disconnect,
  listen,
  ping,
  publish,
  request,
  bindQueue,
}
