import { mongoose, ObjectId, encryption } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IAlertRule,
  AlertRuleConditionType,
  AlertRuleFilterType,
  AlertRuleActionType,
  DataWithCursor,
  ICursor,
  AlertRuleFilterCondition,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface IAlertRuleDocument extends Omit<IAlertRule, '_id'>, Document {
  _id: ObjectId

  toObject(): IAlertRuleDocument
  toJSON(): IAlertRule
}

export interface IAlertRuleModel extends Model<IAlertRuleDocument> {
  createAlertRule(
    payload: Partial<IAlertRuleDocument>
  ): Promise<IAlertRuleDocument>

  findAlertRuleById(
    id: string | ObjectId
  ): Promise<IAlertRuleDocument | undefined>

  findAlertRuleByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IAlertRuleDocument | undefined>

  findAlertRules(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
      enabled?: boolean,
    },
    cursor?: ICursor,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IAlertRuleDocument>>

  updateAlertRuleById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    payload: Partial<IAlertRule>,
  ): Promise<IAlertRuleDocument | undefined>

  deleteAlertRuleById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
  ): Promise<void>

  deleteAlertRulesByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteActionsByIntegration(
    integrationId: string | ObjectId,
  ): Promise<void>

  findAlertRuleCredentials(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<Pick<IAlertRule, 'actions'> | null>
}

const AlertRuleSchema = new Schema({
  workspace: {
    type: ObjectId,
    ref: 'Workspaces',
    required: true,
  },
  project: {
    type: ObjectId,
    ref: 'Projects',
    required: true,
  },
  name: {
    type: String,
  },
  enabled: {
    type: Boolean,
  },
  scope: {
    environmentName: {
      type: String,
    },
    componentName: {
      type: String,
    },
  },
  conditionOperator: {
    type: String,
    enum: ['ALL', 'ANY'],
    required: true,
  },
  conditions: [{
    type: {
      type: String,
      enum: Object.values(AlertRuleConditionType),
      required: true,
    },
    interval: {
      type: String,
    },
    value: {
      type: String,
    },
  }],
  filterOperator: {
    type: String,
    enum: ['ALL', 'ANY', 'NONE'],
    required: true,
  },
  filters: [{
    type: {
      type: String,
      enum: Object.values(AlertRuleFilterType),
      required: true,
    },
    match: {
      type: String,
      enum: Object.values(AlertRuleFilterCondition),
    },
    attribute: {
      type: String,
    },
    interval: {
      type: String,
    },
    value: {
      type: String,
    },
  }],
  actions: [{
    type: {
      type: String,
      enum: Object.values(AlertRuleActionType),
      required: true,
    },
    integration: {
      type: ObjectId,
      ref: 'Integrations',
    },
    slack: {
      channelId: {
        type: String,
      },
      channelName: {
        type: String,
      },
      workspace: {
        type: String,
      },
      notes: {
        type: String,
      },
      tags: {
        type: String,
      },
    },
    email: {
      // No [] default: it would put an `email` on every action, which validation rejects on round-trips
      workspaceUsers: {
        type: [{
          type: ObjectId,
          ref: 'WorkspaceUsers',
        }],
        default: undefined,
      },
    },
    webhook: {
      url: {
        type: String,
      },
      // Encrypted: stored as the CSFLE ciphertext, so it must not be cast to a string
      secret: {
        type: Schema.Types.Mixed,
        cast: false,
      },
    },
    teams: {
      // Encrypted: a Teams Workflows URL embeds its own credential
      webhookUrl: {
        type: Schema.Types.Mixed,
        cast: false,
      },
    },
    slackWebhook: {
      // Encrypted: a Slack incoming webhook URL embeds its own credential
      webhookUrl: {
        type: Schema.Types.Mixed,
        cast: false,
      },
    },
  }],
}, {
  timestamps: true,
})

type AlertRuleActions = IAlertRule['actions']

// Write-only action credentials: the channel object holding each, its field, and the flag that
// API responses carry instead
const ACTION_CREDENTIALS = [
  { channel: 'webhook', field: 'secret', flag: 'hasSecret' },
  { channel: 'teams', field: 'webhookUrl', flag: 'hasWebhookUrl' },
  { channel: 'slackWebhook', field: 'webhookUrl', flag: 'hasWebhookUrl' },
] as const

const getCredentialHolder = (action: AlertRuleActions[number], channel: typeof ACTION_CREDENTIALS[number]['channel']) =>
  action[channel] as Record<string, any> | undefined

// Action credentials are written encrypted (and decrypted transparently on read). They never
// leave the model through API responses or caches - those carry a "configured" flag instead.
// The interface types them as the decrypted string; the ciphertext is a BSON Binary.
const encryptActionCredentials = async (actions?: AlertRuleActions) => {
  for (const action of actions || []) {
    for (const { channel, field } of ACTION_CREDENTIALS) {
      const holder = getCredentialHolder(action, channel)

      if (typeof holder?.[field] === 'string' && holder[field]) {
        holder[field] = await encryption.encrypt(holder[field])
      }
    }
  }
}

export const toPublicAlertRule = <T extends { actions?: AlertRuleActions }>(alertRule: T): T => {
  for (const action of alertRule?.actions || []) {
    for (const { channel, field, flag } of ACTION_CREDENTIALS) {
      const holder = getCredentialHolder(action, channel)

      if (holder) {
        holder[flag] = Boolean(holder[field])
        delete holder[field]
      }
    }
  }

  return alertRule
}

// The stored counterpart of actions[index], whose write-only credentials it inherits: matched by
// id, or - for clients that drop ids - by position among actions of the same type. A positional
// match must keep the webhook URL, so a secret never moves to a different receiver.
export const findStoredAction = (
  actions: AlertRuleActions,
  index: number,
  storedActions: AlertRuleActions,
): AlertRuleActions[number] | undefined => {
  const action: any = actions[index]

  if (action._id) {
    return storedActions.find(({ _id }: any) => String(_id) === String(action._id))
  }

  const sameTypeIndex = actions.slice(0, index).filter(({ type }) => type === action.type).length
  const stored = storedActions.filter(({ type }) => type === action.type)[sameTypeIndex]

  return stored && (!action.webhook || stored.webhook?.url === action.webhook.url) ? stored : undefined
}

// Credentials are write-only, so an edit that omits one keeps the stored value
const keepStoredCredentials = (actions: AlertRuleActions, storedActions: AlertRuleActions) => {
  actions.forEach((action, index) => {
    const stored = findStoredAction(actions, index, storedActions)

    for (const { channel, field } of ACTION_CREDENTIALS) {
      const holder = getCredentialHolder(action, channel)
      const storedValue = stored && getCredentialHolder(stored, channel)?.[field]

      if (holder && !holder[field] && storedValue) {
        holder[field] = storedValue
      }
    }
  })
}

// Both conversions strip credentials, so no route or cache can leak them by serializing a
// document. Only the explicit lean reads (findAlertRuleCredentials, updates) see them.
for (const conversion of ['toJSON', 'toObject'] as const) {
  AlertRuleSchema.set(conversion, {
    transform: function (doc, ret: Record<string, any>) {
      return toPublicAlertRule(ret)
    },
  })
}

AlertRuleSchema.statics.createAlertRule = async function (
  payload: Partial<IAlertRule>,
) {
  await encryptActionCredentials(payload.actions)

  return this.findOneAndUpdate(
    payload,
    payload,
    {
      upsert: true,
      returnDocument: 'after',
      runValidators: true,
    },
  )
}

AlertRuleSchema.statics.findAlertRuleById = function(id: string | ObjectId) {
  return this.findOne({ _id: id })
}

AlertRuleSchema.statics.findAlertRuleByIdAndProjectAndWorkspace = function(
  id: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
) {
  return this.findOne({
    _id: id,
    workspace: workspaceId,
    project: projectId,
  })
}

AlertRuleSchema.statics.findAlertRules = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,
    enabled?: boolean,
  },
  cursor: ICursor = {},
  sort?: ISortOptions,
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const _sort: any = {}

  if (sort?.sortKey) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort._id = -1
  }

  const conditions: any = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
  }

  if (typeof filter.enabled === 'boolean') {
    conditions.enabled = !filter.enabled ? { $ne: true } : true
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: conditions,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $sort: _sort },
          ...(
            typeof cursor?.skip === 'number'
            && typeof cursor?.limit === 'number'
          )
            ? [
              { $skip: cursor.skip },
              { $limit: cursor.limit },
            ]
            : [],
        ],
      },
    },
  ])

  return {
    data: items.map(toPublicAlertRule),
    cursor: {
      total: count,
      skip: cursor.skip,
      limit: cursor.limit,
    },
  }
}

AlertRuleSchema.statics.updateAlertRuleById = async function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  payload: Partial<IAlertRule>,
): Promise<IAlertRuleDocument | undefined> {
  if (payload.actions) {
    const stored = await this.findOne({ _id: id, workspace: workspaceId, project: projectId }, { actions: 1 }).lean()
    keepStoredCredentials(payload.actions, stored?.actions || [])
    await encryptActionCredentials(payload.actions)
  }

  return this.findOneAndUpdate(
    {
      _id: id,
      workspace: workspaceId,
      project: projectId,
    },
    {
      $set: {
        ...payload,
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    },
  )
}

AlertRuleSchema.statics.deleteAlertRuleById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    _id: id,
    workspace: workspaceId,
    project: projectId,
  })
}

AlertRuleSchema.statics.deleteAlertRulesByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

AlertRuleSchema.statics.deleteActionsByIntegration = function (
  integrationId: string | ObjectId,
): Promise<void> {
  return this.updateMany(
    {
      'actions.integration': new ObjectId(integrationId),
    },
    { $pull: { actions: { integration: integrationId } } },
  )
}

// Only for delivering an alert: returns the decrypted action credentials. Always scoped to the
// rule's project - an unscoped lookup would let one workspace deliver with another's credentials.
AlertRuleSchema.statics.findAlertRuleCredentials = async function (
  id: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
) {
  if (!id || !projectId || !workspaceId) {
    return null
  }

  return this.findOne({ _id: id, project: projectId, workspace: workspaceId }, { actions: 1 }).lean()
}

AlertRuleSchema.index({
  workspace: 1,
  project: 1,
})

export const AlertRuleModel = mongoose.model<IAlertRuleDocument, IAlertRuleModel>(
  'Alert-Rule',
  AlertRuleSchema,
)
