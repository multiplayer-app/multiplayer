import type { Request, Response, NextFunction } from 'express'
import { EndUserModel } from '@multiplayer/models'

import {
  RemoteSessionRecordingConditionCompareOperator,
  SessionRecordingMode,
  IConditionalRecordingFilters,
  IRecordingOptions,
} from '@multiplayer/types'
import {
  InvalidArgumentError,
} from 'restify-errors'
import {
  RemoteSessionRecordingConditionsAttributePathPrefix,
} from '../../types'
import { ConditionalRecordingFiltersService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      sessionAttributes,
      resourceAttributes,
      userAttributes,
    } = req.body || {}

    const workspaceId = req?.rawApiKeyPayload?.workspace || req?.body?.workspace
    const projectId = req?.rawApiKeyPayload?.project || req?.body?.project

    if (!workspaceId || !projectId) {
      throw new InvalidArgumentError()
    }

    const startConditionsAttributePath = [
      ...Object.keys(sessionAttributes || {}).map((key) => `session.attributes.${key}`),
      ...Object.keys(resourceAttributes || {}).map((key) => `session.resource.attributes.${key}`),
      ...Object.keys(userAttributes || {}).map((key) => `session.user.attributes.${key}`),
    ]

    const conditionalRecordingSettings = await ConditionalRecordingFiltersService.getConditionalRecordingSettings(projectId)

    const matchingConditions = conditionalRecordingSettings.filters.filter((remoteSessionRecordingCondition) => {
      return remoteSessionRecordingCondition.conditions.start.every((condition) => {
        let clientValue = ''

        if (condition.attributePath.startsWith(RemoteSessionRecordingConditionsAttributePathPrefix.SPAN_ATTRIBUTE)) {
          clientValue = sessionAttributes?.[condition.attributePath.replace(RemoteSessionRecordingConditionsAttributePathPrefix.SPAN_ATTRIBUTE, '')]
        } else if (condition.attributePath.startsWith(RemoteSessionRecordingConditionsAttributePathPrefix.SPAN_RESOURCE_ATTRIBUTE)) {
          clientValue = resourceAttributes?.[condition.attributePath.replace(RemoteSessionRecordingConditionsAttributePathPrefix.SPAN_RESOURCE_ATTRIBUTE, '')]
        }

        switch (condition.conditionType) {
          case RemoteSessionRecordingConditionCompareOperator.EQUALS:
            return clientValue === condition.value
          case RemoteSessionRecordingConditionCompareOperator.NOT_EQUALS:
            return clientValue !== condition.value
          case RemoteSessionRecordingConditionCompareOperator.CONTAINS:
            return clientValue.includes(condition.value || '')
          case RemoteSessionRecordingConditionCompareOperator.NOT_CONTAINS:
            return !clientValue.includes(condition.value || '')
          case RemoteSessionRecordingConditionCompareOperator.GREATER_THAN:
            try {
              return parseFloat(clientValue) > parseFloat(condition.value || '')
            } catch (e) {
              return false
            }
          case RemoteSessionRecordingConditionCompareOperator.GREATER_THAN_OR_EQUALS:
            try {
              return parseFloat(clientValue) >= parseFloat(condition.value || '')
            } catch (e) {
              return false
            }
          case RemoteSessionRecordingConditionCompareOperator.LESS_THAN:
            try {
              return parseFloat(clientValue) < parseFloat(condition.value || '')
            } catch (e) {
              return false
            }
          case RemoteSessionRecordingConditionCompareOperator.LESS_THAN_OR_EQUALS:
            try {
              return parseFloat(clientValue) <= parseFloat(condition.value || '')
            } catch (e) {
              return false
            }
          case RemoteSessionRecordingConditionCompareOperator.EXISTS:
            return !!clientValue
          case RemoteSessionRecordingConditionCompareOperator.NOT_EXISTS:
            return !clientValue

          default:
            return false
        }
      })
    })

    let shouldStart = false
    let mode: SessionRecordingMode

    if (matchingConditions.length > 0) {
      const _matchingCondition = matchingConditions.reduce<IConditionalRecordingFilters>(
        (max, current) => {
          if (!max || current.samplingRate > max.samplingRate) {
            return current
          }
          return max
        },
        matchingConditions[0],
      )

      mode = _matchingCondition.mode

      shouldStart = Math.random() * 100 < _matchingCondition.samplingRate * 100
    } else {
      const samplingRate = conditionalRecordingSettings.global?.samplingRate || 0
      shouldStart = Math.random() * 100 < samplingRate * 100

      mode = SessionRecordingMode.CONTINUOUS
    }

    let recordingOptions: IRecordingOptions = {
      frontend: {
        screens: true,
        traces: true,
        logs: true,
        logLevel: 'info',
        content: true,
      },
      backend: {
        traces: true,
        logs: true,
        logLevel: 'info',
        content: true,
      },
    }

    if (userAttributes) {
      const endUser = await EndUserModel.findEndUser({
        attributes: userAttributes,
        project: projectId,
        workspace: workspaceId,
      })

      if (endUser?.conditionalRecordingSettings?.recordingOptions) {
        recordingOptions = endUser.conditionalRecordingSettings.recordingOptions
      } else if (conditionalRecordingSettings.global?.recordingOptions) {
        recordingOptions = conditionalRecordingSettings.global?.recordingOptions
      }
    }

    return res.status(200).json({
      shouldStart,
      mode,
      recordingOptions,
    })
  } catch (err) {
    return next(err)
  }
}
