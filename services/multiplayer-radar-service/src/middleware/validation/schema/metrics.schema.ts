import { Joi } from '@multiplayer/util'
import {
  MetricName,
  IssueGroupBy,
} from '@multiplayer/types'
import {
  MetricsGranularity,
} from '../../../types'

export const getMetricsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    issueId: Joi.string().hex().length(24),
    issueTitleHash: Joi.string().max(100),
    issueComponentHash: Joi.string().max(100),
    issueCustomHash: Joi.string().max(100),
    endUserHash: Joi.string().max(100),
    'from': Joi.date().iso(),
    'to': Joi.date().iso(),
    'granularity': Joi.string().valid(...Object.values(MetricsGranularity)),
    release: Joi.string().max(100),
    environment: Joi.string().max(100),
    metricName: Joi.alternatives().try(
      Joi.array().items(Joi.string().valid(...Object.values(MetricName))),
      Joi.string().valid(...Object.values(MetricName)),
    ).required(),
    groupBy: Joi.string().valid(...Object.values(IssueGroupBy)),
  }),
})
