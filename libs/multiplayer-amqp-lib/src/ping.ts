import connector from './connector'

/**
 * @description Get connection status.
 * @returns {boolean}
 */
const ping = (): boolean => {
  return connector.connected
}

export default ping
