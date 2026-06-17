import expressJSDocSwagger, { Options as SwaggerOptions } from 'express-jsdoc-swagger'
import logger from '@multiplayer/logger'
import { Config as ApmConfig } from '@multiplayer/apm'
import { readFileSync } from 'fs'
import path from 'path'
import {
  SWAGGER_ENABLED,
  API_PREFIX,
  PORT,
} from './config'

const swaggerDoc = JSON.parse(readFileSync(path.join(__dirname, '../doc/swagger.json'), 'utf-8'))

const swaggerOptions: SwaggerOptions = {
  info: {
    version: ApmConfig.SERVICE_VERSION,
    title: ApmConfig.SERVICE_NAME,
  },
  security: {},
  filesPattern: './**/*.ts',
  baseDir: '.',
  swaggerUIPath: path.join(API_PREFIX, 'docs'),
}

export const init = (app) => {
  if (SWAGGER_ENABLED) {
    expressJSDocSwagger(app)(swaggerOptions, swaggerDoc)

    logger.info(
      `Swagger endpoint: http://localhost:${PORT}${swaggerOptions.swaggerUIPath}`,
    )
  }
}
