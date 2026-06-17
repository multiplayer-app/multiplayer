const fs = require('fs')

const PackageJson = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`, 'utf-8'))
const SERVICE_NAME = PackageJson?.name?.split('/')?.pop() || process.env.npm_package_name
// const SERVICE_VERSION = process.env.VERSION || PackageJson.version
const PLATFORM_ENV = process.env.PLATFORM_ENV
// const NODE_ENV = process.env.NODE_ENV
const NEW_RELIC_LICENSE_KEY = process.env.NEW_RELIC_LICENSE_KEY
const NEW_RELIC_LOG_LEVEL = process.env.NEW_RELIC_LOG_LEVEL

/**
 * New Relic agent configuration.
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  distributed_tracing: {
    enabled: false,
    exclude_newrelic_header: false,
  },
  app_name: [`${PLATFORM_ENV}-${SERVICE_NAME}`],
  license_key: NEW_RELIC_LICENSE_KEY,
  logging: {
    level: NEW_RELIC_LOG_LEVEL,
    filepath: 'stdout'
  },
  /**
   * When true, all request headers except for those listed in attributes.exclude
   * will be captured for all traces, unless otherwise specified in a destination's
   * attributes include/exclude lists.
   */
  allow_all_headers: true,
  attributes: {
    /**
     * Prefix of attributes to exclude from all destinations. Allows * as wildcard
     * at end.
     * NOTE: If excluding headers, they must be in camelCase form to be filtered.
     * @env NEW_RELIC_ATTRIBUTES_EXCLUDE
     */
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*',
    ],
  },
}
