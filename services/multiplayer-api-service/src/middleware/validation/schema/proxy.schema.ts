import { Joi } from '@multiplayer/util'
import { API_DOMAIN, API_PREFIX, API_PROTOCOL } from '../../../config'

enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

const excludedUrlPattern = new RegExp(
  `.*${API_DOMAIN}${API_PREFIX}/workspaces/[a-fA-F0-9]{24}/projects/[a-fA-F0-9]{24}/proxy$`,
)

export const proxyRequestSchema = Joi.object({
  body: Joi.object({
    method: Joi.string()
      .valid(...Object.values(HttpMethod))
      .required(),
    url: Joi.string().uri().regex(excludedUrlPattern, { invert: true }).required(),
    headers: Joi.object()
      .pattern(Joi.string(), Joi.string()),
    params: Joi.object().pattern(Joi.string(), Joi.any()),
    data: Joi.any(),
  }).required(),
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
})

