import * as fs from 'fs'

// npm_package_name is only set by npm/pnpm when the process is launched via a
// package-manager script (e.g. `npm run dev`) - Docker's CMD invokes `node
// ./dist/index.js` directly, so that env var is never set in production and the
// name silently fell back to 'tests'. Reading package.json from cwd works
// regardless of how the process was started (same approach as multiplayer-apm-lib).
const PackageJson = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`, 'utf-8'))

export const NODE_ENV = process.env.NODE_ENV || 'development'
export const isProduction = NODE_ENV === 'production'
export const APP_NAME = PackageJson.name?.split('/').pop() || 'tests'
export const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')
