import mongo, { mongoose, ObjectId, runtimeAdapters } from '@multiplayer/mongo'
import redis from '@multiplayer/redis'
import {
  AlertRuleModel,
  AlertHistoryModel,
  ProjectModel,
  WorkspaceModel,
  WorkspaceUserModel,
} from '@multiplayer/models'
import {
  AlertRuleActionType,
  AlertRuleConditionType,
  NotificationType,
  WorkspaceUserStatus,
  type IAlertRule,
  type IIssue,
} from '@multiplayer/types'
import * as AlertService from '../src/services/alert.service'
import { InternalNotificationService } from '../src/services/notification.internal.service'
import { AlertRulesCache } from '../src/cache'
import { createAlertRuleSchema } from '../src/middleware/validation/schema/alert-rules.schema'

// Email, webhook and Teams alert actions: credentials are encrypted at rest, write-only through
// the API and caches, and only ever delivered with the rule's own project.

const WORKSPACE_ID = new ObjectId().toString()
const PROJECT_ID = new ObjectId().toString()
const OTHER_WORKSPACE_ID = new ObjectId().toString()
const OTHER_PROJECT_ID = new ObjectId().toString()

const WEBHOOK_SECRET = 'whsec_alert_channels_0123456789'
const TEAMS_URL = 'https://acme.webhook.office.com/webhookb2/alert-channels-credential'
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T0000/B0000/alert-channels-credential'

const ACTIVE_MEMBER = new ObjectId().toString()
const INACTIVE_MEMBER = new ObjectId().toString()
const FOREIGN_MEMBER = new ObjectId().toString()

const issue = {
  _id: new ObjectId().toString(),
  workspace: WORKSPACE_ID,
  project: PROJECT_ID,
  title: 'Order service unavailable',
  componentHash: 'alert-channels-component',
  service: { serviceName: 'checkout', serviceNameSlug: 'checkout', environment: 'production', environmentSlug: 'production' },
} as any as IIssue

const withoutCredentials = (actions: IAlertRule['actions']) => actions.map(({ webhook, teams, slackWebhook, ...action }: any) => ({
  ...action,
  ...webhook ? { webhook: { url: webhook.url } } : {},
  ...teams ? { teams: {} } : {},
  ...slackWebhook ? { slackWebhook: {} } : {},
}))

let alertRule: IAlertRule

const readRawAlertRule = async () => {
  // A client without auto-decryption shows what is actually stored
  const client = await new mongoose.mongo.MongoClient(process.env.MONGODB_URI as string, { runtimeAdapters }).connect()
  try {
    return await client.db(AlertRuleModel.db.name)
      .collection(AlertRuleModel.collection.collectionName)
      .findOne({ _id: new ObjectId(alertRule._id) })
  } finally {
    await client.close()
  }
}

beforeAll(async () => {
  await mongo.connect()
  await redis.connect()

  alertRule = (await AlertRuleModel.createAlertRule({
    workspace: WORKSPACE_ID,
    project: PROJECT_ID,
    name: 'alert-channels',
    enabled: true,
    conditionOperator: 'ANY',
    conditions: [{ type: AlertRuleConditionType.ISSUE_UNARCHIVED }],
    filterOperator: 'ANY',
    filters: [],
    actions: [
      { type: AlertRuleActionType.SEND_EMAIL_NOTIFICATION, email: { workspaceUsers: [ACTIVE_MEMBER, INACTIVE_MEMBER, FOREIGN_MEMBER] } },
      { type: AlertRuleActionType.SEND_WEBHOOK_NOTIFICATION, webhook: { url: 'https://hooks.example.com/alerts', secret: WEBHOOK_SECRET } },
      { type: AlertRuleActionType.SEND_TEAMS_NOTIFICATION, teams: { webhookUrl: TEAMS_URL } },
      { type: AlertRuleActionType.SEND_SLACK_WEBHOOK_NOTIFICATION, slackWebhook: { webhookUrl: SLACK_WEBHOOK_URL } },
    ],
  } as any)).toJSON()
  await AlertRulesCache.del(PROJECT_ID)
})

beforeEach(() => {
  jest.spyOn(ProjectModel, 'findProjectById').mockResolvedValue({ toObject: () => ({ _id: PROJECT_ID, name: 'Shop' }) } as any)
  jest.spyOn(WorkspaceModel, 'findWorkspaceById').mockResolvedValue({ toObject: () => ({ _id: WORKSPACE_ID, name: 'Acme' }) } as any)
  jest.spyOn(WorkspaceUserModel, 'findWorkspaceUserByIds').mockResolvedValue([
    { _id: ACTIVE_MEMBER, workspace: WORKSPACE_ID, status: WorkspaceUserStatus.ACTIVE, user: { primaryEmail: 'active@example.com' } },
    { _id: INACTIVE_MEMBER, workspace: WORKSPACE_ID, status: WorkspaceUserStatus.NOT_ACTIVE, user: { primaryEmail: 'inactive@example.com' } },
    { _id: FOREIGN_MEMBER, workspace: OTHER_WORKSPACE_ID, status: WorkspaceUserStatus.ACTIVE, user: { primaryEmail: 'foreign@example.com' } },
  ] as any)
  jest.spyOn(InternalNotificationService.prototype, 'sendNotification').mockResolvedValue(undefined)
})

afterEach(() => {
  jest.restoreAllMocks()
})

afterAll(async () => {
  await Promise.all([
    AlertRuleModel.deleteMany({ workspace: WORKSPACE_ID }),
    AlertHistoryModel.deleteMany({ workspace: { $in: [WORKSPACE_ID, OTHER_WORKSPACE_ID] } }),
    AlertRulesCache.del(PROJECT_ID),
  ])
  await mongo.disconnect()
  await redis.disconnect()
})

const sentNotifications = () => (InternalNotificationService.prototype.sendNotification as jest.Mock).mock.calls.map(([variables]) => variables)

describe('Alert channel credentials', () => {
  it('stores them encrypted', async () => {
    const raw = await readRawAlertRule()

    for (const ciphertext of [raw?.actions[1].webhook.secret, raw?.actions[2].teams.webhookUrl, raw?.actions[3].slackWebhook.webhookUrl]) {
      expect(ciphertext).toBeInstanceOf(mongoose.mongo.Binary)
      expect(ciphertext.sub_type).toBe(6)
    }
    expect(JSON.stringify(raw)).not.toContain(WEBHOOK_SECRET)
    expect(JSON.stringify(raw)).not.toContain(TEAMS_URL)
    expect(JSON.stringify(raw)).not.toContain(SLACK_WEBHOOK_URL)
  })

  it('never returns them from documents, listings or the cache', async () => {
    const document = await AlertRuleModel.findAlertRuleByIdAndProjectAndWorkspace(alertRule._id, PROJECT_ID, WORKSPACE_ID)
    const { data } = await AlertRuleModel.findAlertRules({ workspace: WORKSPACE_ID, project: PROJECT_ID })
    await AlertService.getAlertRules(WORKSPACE_ID, PROJECT_ID)

    for (const exposed of [alertRule, document?.toJSON(), document?.toObject(), data, await AlertRulesCache.get(PROJECT_ID)]) {
      expect(JSON.stringify(exposed)).not.toContain(WEBHOOK_SECRET)
      expect(JSON.stringify(exposed)).not.toContain(TEAMS_URL)
      expect(JSON.stringify(exposed)).not.toContain(SLACK_WEBHOOK_URL)
    }
    expect(alertRule.actions[1].webhook).toEqual({ url: 'https://hooks.example.com/alerts', hasSecret: true })
    expect(alertRule.actions[2].teams).toEqual({ hasWebhookUrl: true })
    expect(alertRule.actions[3].slackWebhook).toEqual({ hasWebhookUrl: true })
    // Actions only carry their own channel's fields, so they validate when sent back
    expect(alertRule.actions[1]).not.toHaveProperty('email')
    expect(alertRule.actions[2]).not.toHaveProperty('webhook')
  })

  it('reads them decrypted for delivery, within the rule\'s own project only', async () => {
    const stored = await AlertRuleModel.findAlertRuleCredentials(alertRule._id, PROJECT_ID, WORKSPACE_ID)

    expect(stored?.actions[1].webhook?.secret).toBe(WEBHOOK_SECRET)
    expect(stored?.actions[2].teams?.webhookUrl).toBe(TEAMS_URL)
    expect(stored?.actions[3].slackWebhook?.webhookUrl).toBe(SLACK_WEBHOOK_URL)
    expect(await AlertRuleModel.findAlertRuleCredentials(alertRule._id, OTHER_PROJECT_ID, OTHER_WORKSPACE_ID)).toBeNull()
  })

  it('keeps them when an update omits them and replaces them when given', async () => {
    await AlertRuleModel.updateAlertRuleById(WORKSPACE_ID, PROJECT_ID, alertRule._id, {
      name: 'alert-channels-renamed',
      actions: withoutCredentials(alertRule.actions),
    })
    let stored = await AlertRuleModel.findAlertRuleCredentials(alertRule._id, PROJECT_ID, WORKSPACE_ID)
    expect(stored?.actions[1].webhook?.secret).toBe(WEBHOOK_SECRET)
    expect(stored?.actions[2].teams?.webhookUrl).toBe(TEAMS_URL)
    expect(stored?.actions[3].slackWebhook?.webhookUrl).toBe(SLACK_WEBHOOK_URL)

    const rotated = withoutCredentials(alertRule.actions)
    rotated[1].webhook = { url: 'https://hooks.example.com/alerts', secret: `${WEBHOOK_SECRET}-rotated` }
    await AlertRuleModel.updateAlertRuleById(WORKSPACE_ID, PROJECT_ID, alertRule._id, { actions: rotated })
    stored = await AlertRuleModel.findAlertRuleCredentials(alertRule._id, PROJECT_ID, WORKSPACE_ID)
    expect(stored?.actions[1].webhook?.secret).toBe(`${WEBHOOK_SECRET}-rotated`)

    await AlertRuleModel.updateAlertRuleById(WORKSPACE_ID, PROJECT_ID, alertRule._id, {
      actions: [{ type: AlertRuleActionType.SEND_EMAIL_NOTIFICATION, email: { workspaceUsers: [] } }] as any,
    })
    await AlertRuleModel.updateAlertRuleById(WORKSPACE_ID, PROJECT_ID, alertRule._id, { actions: alertRule.actions })
    stored = await AlertRuleModel.findAlertRuleCredentials(alertRule._id, PROJECT_ID, WORKSPACE_ID)
    // A removed action takes its credentials with it; re-adding it does not resurrect them
    expect(stored?.actions[1].webhook?.secret).toBeUndefined()

    await restoreActions()
  })

  it('lets an edit without action ids keep a secret only for the same receiver', async () => {
    const withoutIds = (url: string) => withoutCredentials(alertRule.actions)
      .map(({ _id, ...action }: any) => (action.webhook ? { ...action, webhook: { url } } : action))

    await AlertRuleModel.updateAlertRuleById(WORKSPACE_ID, PROJECT_ID, alertRule._id, { actions: withoutIds('https://hooks.example.com/alerts') })
    let stored = await AlertRuleModel.findAlertRuleCredentials(alertRule._id, PROJECT_ID, WORKSPACE_ID)
    expect(stored?.actions[1].webhook?.secret).toBe(WEBHOOK_SECRET)
    expect(stored?.actions[2].teams?.webhookUrl).toBe(TEAMS_URL)

    await AlertRuleModel.updateAlertRuleById(WORKSPACE_ID, PROJECT_ID, alertRule._id, { actions: withoutIds('https://other-receiver.example.com/alerts') })
    stored = await AlertRuleModel.findAlertRuleCredentials(alertRule._id, PROJECT_ID, WORKSPACE_ID)
    expect(stored?.actions[1].webhook?.secret).toBeUndefined()

    await restoreActions()
  })
})

// Puts the original actions (ids and credentials) back for the tests that follow
const restoreActions = async () => {
  await AlertRuleModel.updateAlertRuleById(WORKSPACE_ID, PROJECT_ID, alertRule._id, {
    name: alertRule.name,
    actions: [
      alertRule.actions[0],
      { ...alertRule.actions[1], webhook: { url: 'https://hooks.example.com/alerts', secret: WEBHOOK_SECRET } },
      { ...alertRule.actions[2], teams: { webhookUrl: TEAMS_URL } },
      { ...alertRule.actions[3], slackWebhook: { webhookUrl: SLACK_WEBHOOK_URL } },
    ] as any,
  })
  await AlertRulesCache.del(PROJECT_ID)
}

describe('Alert delivery', () => {
  it('notifies every channel, emailing only active members of the rule\'s workspace', async () => {
    const credentialLookup = jest.spyOn(AlertRuleModel, 'findAlertRuleCredentials')

    await AlertService.sendAlert(WORKSPACE_ID, PROJECT_ID, { issue, conditionType: AlertRuleConditionType.ISSUE_UNARCHIVED })

    // Webhook and Teams both need credentials; the rule is decrypted once
    expect(credentialLookup).toHaveBeenCalledTimes(1)

    // Actions are dispatched concurrently, so the order is not defined
    const notifications = sentNotifications()
    const byType = (type: NotificationType) => notifications.filter(({ notificationType }) => notificationType === type)
    expect(notifications).toHaveLength(4)
    expect(byType(NotificationType.EMAIL).map(({ email }) => email)).toEqual(['active@example.com'])
    expect(byType(NotificationType.WEBHOOK).map(({ webhookOptions }) => webhookOptions))
      .toEqual([{ url: 'https://hooks.example.com/alerts', secret: WEBHOOK_SECRET }])
    expect(byType(NotificationType.TEAMS).map(({ teamsOptions }) => teamsOptions)).toEqual([{ webhookUrl: TEAMS_URL }])
    expect(byType(NotificationType.SLACK_WEBHOOK).map(({ slackWebhookOptions }) => slackWebhookOptions))
      .toEqual([{ webhookUrl: SLACK_WEBHOOK_URL }])
    for (const { template, data } of notifications) {
      expect(template).toBe(AlertRuleConditionType.ISSUE_UNARCHIVED)
      expect(data).toMatchObject({ alertRuleName: 'alert-channels', project: { name: 'Shop' }, issue: { title: issue.title } })
    }
  })

  it('does not lend stored credentials to a test run from another project', async () => {
    const testAction = (actions: IAlertRule['actions']) => ({ ...alertRule, actions } as IAlertRule)
    const payload = { issue, conditionType: AlertRuleConditionType.ISSUE_UNARCHIVED }

    await AlertService.sendAlert(OTHER_WORKSPACE_ID, OTHER_PROJECT_ID, payload, true, testAction(withoutCredentials([alertRule.actions[2]])))
    expect(sentNotifications()).toEqual([])

    await AlertService.sendAlert(WORKSPACE_ID, PROJECT_ID, payload, true, testAction(withoutCredentials([alertRule.actions[2]])))
    expect(sentNotifications().map(({ teamsOptions }) => teamsOptions)).toEqual([{ webhookUrl: TEAMS_URL }])
  })
})

describe('Slack incoming webhook actions', () => {
  const validate = (webhookUrl: string) => createAlertRuleSchema.validate({
    params: { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID },
    body: {
      enabled: true,
      conditionOperator: 'ANY',
      conditions: [{ type: AlertRuleConditionType.NEW_ISSUE_CREATED }],
      filterOperator: 'NONE',
      actions: [{ type: AlertRuleActionType.SEND_SLACK_WEBHOOK_NOTIFICATION, slackWebhook: { webhookUrl } }],
    },
  }).error

  it('accepts only Slack incoming webhook URLs', () => {
    expect(validate('https://hooks.slack.com/services/T0000/B0000/xyz')).toBeUndefined()
    expect(validate('https://hooks.slack-gov.com/services/T0000/B0000/xyz')).toBeUndefined()
    expect(validate('https://hooks.slack.com.attacker.example/services/x')).toBeDefined()
    expect(validate('http://hooks.slack.com/services/x')).toBeDefined()
  })
})
