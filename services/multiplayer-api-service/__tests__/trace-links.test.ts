import request from 'supertest'
import { ObjectId } from '@multiplayer/mongo'
import { ProjectModel } from '@multiplayer/models'
import { AccessControlContext } from '@multiplayer/auth'
import { AlertRuleConditionType, IssueCategoryEnum, TraceLinkType } from '@multiplayer/types'
import {
  buildTraceLinks,
  buildTraceLinkUrl,
  getTraceLinkConfigError,
  getTraceLinkTarget,
  DEFAULT_LOKI_TRACE_QUERY,
} from '@multiplayer/util-shared'
import { describeAlert } from '../src/lib/notification/alert-content'
import { buildSlackTemplate } from '../src/lib/notification/slack-templates'
import { buildWebhookPayload } from '../src/lib/notification/webhook.lib'
import { ProjectSchema } from '../src/middleware/validation/schema'
import { ProjectLib } from '../src/lib'
import { app } from '../src/app'
import { API_PREFIX } from '../src/config'
import { Mock, Auth } from './helper'

const TRACE_ID = '4BF92F3577B34DA6A3CE929D0E0E4736'
const SPAN_START = Date.UTC(2026, 9, 26, 12, 0, 0)
const HOUR = 60 * 60 * 1000

const target = {
  traceId: TRACE_ID,
  spanId: '00f067aa0ba902b7',
  serviceName: 'checkout',
  environment: 'production',
  timestamp: SPAN_START,
}

const tempo = { type: TraceLinkType.GRAFANA_TEMPO, name: 'Trace in Grafana', url: 'https://acme.dev/grafana/', datasourceUid: 'tempo-prod', orgId: 2 }
const loki = { type: TraceLinkType.GRAFANA_LOKI, name: 'Logs in Grafana', url: 'https://grafana.acme.dev', datasourceUid: 'loki' }
const jaeger = { type: TraceLinkType.CUSTOM, name: 'Jaeger', urlTemplate: 'https://jaeger.acme.dev/trace/{traceId}?service={serviceName}' }

// The Explore pane of a Grafana link, decoded
const explorePane = (url: string) => {
  const { searchParams, pathname, origin } = new URL(url)
  return { origin, pathname, orgId: searchParams.get('orgId'), pane: JSON.parse(searchParams.get('panes') as string).mp }
}

describe('Trace link URLs', () => {
  it('opens the trace in Grafana Tempo Explore, around the span', () => {
    const url = buildTraceLinkUrl(tempo, target) as string
    const { origin, pathname, orgId, pane } = explorePane(url)

    expect(`${origin}${pathname}`).toBe('https://acme.dev/grafana/explore')
    expect(orgId).toBe('2')
    expect(pane.datasource).toBe('tempo-prod')
    expect(pane.queries[0]).toMatchObject({
      datasource: { type: 'tempo', uid: 'tempo-prod' },
      queryType: 'traceql',
      query: TRACE_ID.toLowerCase(),
    })
    expect(pane.range).toEqual({ from: String(SPAN_START - HOUR), to: String(SPAN_START + HOUR) })
    // Grafana does not decode `+` as a space
    expect(url).not.toContain('+')
  })

  it('queries the trace\'s logs in Grafana Loki, escaping values inside LogQL strings', () => {
    const { pane } = explorePane(buildTraceLinkUrl(loki, { ...target, serviceName: 'pay"ments\\v2' }) as string)

    expect(pane.queries[0]).toMatchObject({ datasource: { type: 'loki', uid: 'loki' }, editorMode: 'code' })
    expect(pane.queries[0].expr).toBe(`{service_name="pay\\"ments\\\\v2"} | trace_id="${TRACE_ID.toLowerCase()}"`)
    expect(DEFAULT_LOKI_TRACE_QUERY).toContain('{traceId}')
  })

  it('builds no Loki link for a span without the values its query needs', () => {
    // An empty value would leave `service_name=""`, which Loki rejects
    expect(buildTraceLinkUrl(loki, { ...target, serviceName: undefined })).toBeUndefined()
    expect(buildTraceLinkUrl({ ...loki, query: '{job="api"} | trace_id="{traceId}"' }, { ...target, serviceName: undefined }))
      .toBeDefined()
  })

  it('fills a custom URL template with URL-encoded values', () => {
    expect(buildTraceLinkUrl(jaeger, { ...target, serviceName: 'a&b c' }))
      .toBe(`https://jaeger.acme.dev/trace/${TRACE_ID.toLowerCase()}?service=a%26b%20c`)
  })

  it('reads span times as the platform stores them', () => {
    const range = (timestamp: string | number) => explorePane(buildTraceLinkUrl(tempo, { ...target, timestamp }) as string).pane.range.from

    expect(range('2026-10-26 12:00:00.123456789')).toBe(String(SPAN_START + 123 - HOUR))
    expect(range('2026-10-26T12:00:00.000Z')).toBe(String(SPAN_START - HOUR))
    expect(range(SPAN_START * 1e6)).toBe(String(SPAN_START - HOUR))
  })

  it('builds nothing for an invalid trace id or link', () => {
    expect(buildTraceLinkUrl(tempo, { ...target, traceId: 'not-a-trace' })).toBeUndefined()
    expect(buildTraceLinkUrl({ ...tempo, url: 'ftp://grafana' }, target)).toBeUndefined()
    expect(buildTraceLinkUrl({ type: TraceLinkType.CUSTOM, name: 'x', urlTemplate: 'javascript:alert({traceId})' }, target)).toBeUndefined()
  })

  it.each(Object.values(TraceLinkType))('supports every link type: %s', (type) => {
    expect(buildTraceLinkUrl({ ...tempo, ...loki, ...jaeger, type }, target)).toMatch(/^https:\/\//)
  })

  it('explains invalid link settings', () => {
    expect(getTraceLinkConfigError(tempo)).toBeUndefined()
    expect(getTraceLinkConfigError({ ...tempo, url: 'grafana.acme.dev' })).toMatch(/http\(s\) URL/)
    expect(getTraceLinkConfigError({ ...tempo, datasourceUid: 'a b' })).toMatch(/datasource UID/)
    expect(getTraceLinkConfigError({ ...jaeger, urlTemplate: 'https://jaeger.acme.dev/search' })).toMatch(/\{traceId\}/)
    expect(getTraceLinkConfigError({ ...jaeger, urlTemplate: 'javascript:alert({traceId})' })).toMatch(/http\(s\) URL/)
  })

  it('takes the target from a stored span', () => {
    expect(getTraceLinkTarget({
      TraceId: TRACE_ID,
      SpanId: 'b7ad6b7169203331',
      ServiceName: 'checkout',
      Timestamp: '2026-10-26 12:00:00.000',
      ResourceAttributes: { 'deployment.environment.name': 'production' },
    })).toEqual({ traceId: TRACE_ID, spanId: 'b7ad6b7169203331', serviceName: 'checkout', environment: 'production', timestamp: '2026-10-26 12:00:00.000' })
    expect(getTraceLinkTarget({})).toBeUndefined()
  })
})

describe('Trace links per environment', () => {
  const production = { ...tempo, environments: ['Production'] }
  const staging = { ...tempo, url: 'https://grafana-staging.acme.dev', environments: ['staging', 'qa'] }
  const hosts = (environment?: string) => buildTraceLinks([production, staging, jaeger], { ...target, environment })
    .map(({ url }) => new URL(url).host)

  it('gives each span the links of its environment, and the links for all environments', () => {
    expect(hosts('production')).toEqual(['acme.dev', 'jaeger.acme.dev'])
    expect(hosts('QA')).toEqual(['grafana-staging.acme.dev', 'jaeger.acme.dev'])
  })

  it('gives a span without an environment only the links for all environments', () => {
    expect(hosts(undefined)).toEqual(['jaeger.acme.dev'])
  })
})

describe('Trace links in alerts', () => {
  const issue = {
    _id: new ObjectId().toString(),
    workspace: new ObjectId().toString(),
    project: new ObjectId().toString(),
    title: 'Order service unavailable',
    titleHash: 'title-hash',
    componentHash: 'component-hash',
    metadata: { message: 'order service unavailable' },
    service: { serviceName: 'checkout', environment: 'production' },
  } as any
  const span = {
    TraceId: TRACE_ID,
    SpanId: 'b7ad6b7169203331',
    ServiceName: 'checkout',
    Timestamp: new Date(SPAN_START).toISOString(),
    SpanKind: 1,
    SpanAttributes: { 'http.request.method': 'POST', 'http.route': '/orders' },
    ResourceAttributes: {},
    Events: [],
  } as any
  const project = { _id: issue.project, name: 'Shop', settings: { traceLinks: [tempo, jaeger] } }
  const workspace = { _id: issue.workspace, name: 'Acme' }
  const data = { issue, span, project, workspace }

  const linkTitles = (links: { title: string }[]) => links.map(({ title }) => title)

  it('adds the project\'s trace links to occurrence alerts', () => {
    const { links } = describeAlert(AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED, data)

    expect(linkTitles(links)).toEqual(['Open Issue', 'Trace in Grafana', 'Jaeger'])
  })

  it('adds only the links of the span\'s environment', () => {
    const { links } = describeAlert(AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED, {
      ...data,
      span: { ...span, ResourceAttributes: { 'deployment.environment.name': 'staging' } },
      project: {
        ...project,
        settings: { traceLinks: [{ ...tempo, name: 'Production trace', environments: ['production'] }, { ...tempo, name: 'Staging trace', environments: ['staging'] }] },
      },
    })

    expect(linkTitles(links)).toEqual(['Open Issue', 'Staging trace'])
  })

  it('uses the issue\'s environment for a span that names none', () => {
    const { links } = describeAlert(AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED, {
      ...data,
      project: { ...project, settings: { traceLinks: [{ ...tempo, name: 'Production trace', environments: ['production'] }] } },
    })

    expect(linkTitles(links)).toEqual(['Open Issue', 'Production trace'])
  })

  it('has no trace links without a span', () => {
    const { links } = describeAlert(AlertRuleConditionType.ISSUE_UNARCHIVED, { ...data, span: undefined })

    expect(linkTitles(links)).toEqual(['Open Issue'])
  })

  it.each([
    AlertRuleConditionType.NEW_ISSUE_CREATED,
    AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN,
    AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED,
  ])('adds them as Slack buttons to %s', (type) => {
    const message = buildSlackTemplate(type, { ...data, spanCount: 10, interval: '1h' })
    const buttons = JSON.stringify(message.attachments)

    expect(buttons).toContain('Trace in Grafana')
    expect(buttons).toContain(`https://jaeger.acme.dev/trace/${TRACE_ID.toLowerCase()}`)
  })

  it('leaves out a link Slack would reject for its length', () => {
    const long = { type: TraceLinkType.CUSTOM, name: 'Long', urlTemplate: `https://example.com/{traceId}?q=${'x'.repeat(3000)}` }
    const message = buildSlackTemplate(AlertRuleConditionType.NEW_ISSUE_CREATED, {
      ...data,
      project: { ...project, settings: { traceLinks: [long] } },
    })

    expect(JSON.stringify(message.attachments)).not.toContain('"Long"')
    expect(JSON.stringify(message.attachments)).toContain('Open Issue')
  })

  it('lists them in webhook payloads', () => {
    const payload = buildWebhookPayload(AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED, data as any, 'delivery')

    expect(linkTitles(payload.links)).toEqual(['Open Issue', 'Trace in Grafana', 'Jaeger'])
  })
})

describe('Trace link settings', () => {
  const validate = (traceLinks: unknown[]) => ProjectSchema.updateProjectSchema.validate({
    params: { workspaceId: new ObjectId().toString(), projectId: new ObjectId().toString() },
    body: { settings: { traceLinks } },
  }).error

  it('accepts valid links and rejects unusable ones', () => {
    expect(validate([tempo, loki, jaeger])).toBeUndefined()
    expect(validate([{ ...jaeger, urlTemplate: 'javascript:alert({traceId})' }])?.message).toMatch(/http\(s\) URL/)
    expect(validate([{ ...tempo, type: 'ZIPKIN' }])).toBeDefined()
    expect(validate([{ ...tempo, environments: ['production', 'staging'] }])).toBeUndefined()
    expect(validate([{ ...tempo, environments: [''] }])).toBeDefined()
    expect(validate(Array.from({ length: 11 }, () => tempo))).toBeDefined()
  })

  it('saves them without touching the other settings sections', async () => {
    const created = await ProjectModel.createProject({ workspace: new ObjectId().toString(), name: 'Trace links' } as any)
    await ProjectModel.updateProjectById(created._id, {
      settings: { issue: { createOnlyForCategories: [IssueCategoryEnum.EXCEPTION] }, agent: { fixabilityScoreThreshold: 70 } },
    })

    const updated = await ProjectModel.updateProjectById(created._id, { settings: { traceLinks: [tempo] } })

    expect(updated?.settings.traceLinks?.map(({ name }) => name)).toEqual(['Trace in Grafana'])
    expect(updated?.settings.issue.createOnlyForCategories).toEqual([IssueCategoryEnum.EXCEPTION])
    expect(updated?.settings.agent?.fixabilityScoreThreshold).toBe(70)

    await ProjectModel.deleteProjectById(created._id)
  })
})

describe('Trace links of a public project', () => {
  it('are returned to its members, not to its guests', async () => {
    const { user } = await Mock.user()
    const { workspace } = await Mock.workspace(user._id)
    const { project } = await Mock.project(workspace._id)
    const cookie = await Auth.generateSession(user._id)
    const url = `${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}`

    await request(app).patch(url).set('Cookie', [cookie]).send({ settings: { traceLinks: [tempo] } }).expect(200)
    // As the access route does it; the test database has no project roles to pick the guest role from
    await ProjectModel.updateProjectAccess(project._id, { guest: { enabled: true, role: new ObjectId().toString() } } as any)
    await AccessControlContext.invalidateContext({ workspaceId: workspace._id.toString() })

    const { body: forMember } = await request(app).get(url).set('Cookie', [cookie]).expect(200)
    expect(forMember.settings.traceLinks.map(({ name }) => name)).toEqual(['Trace in Grafana'])

    const { body: forGuest } = await request(app).get(url).expect(200)
    expect(forGuest.access.guest.enabled).toBe(true)
    expect(forGuest.settings.traceLinks).toBeUndefined()
  })
})

describe('Projects as their viewers see them', () => {
  const project = { name: 'Shop', settings: { traceLinks: [tempo], agent: { fixabilityScoreThreshold: 70 } } }

  it('leave out trace links for guests, in project listings too', () => {
    for (const req of [{ user: { guest: true } }, { context: { guest: true } }]) {
      expect(ProjectLib.forViewer(req, project)).toEqual({ name: 'Shop', settings: { agent: { fixabilityScoreThreshold: 70 } } })
    }
    expect(project.settings.traceLinks).toHaveLength(1)
  })

  it('keep them for members', () => {
    expect(ProjectLib.forViewer({ user: {} }, project)).toBe(project)
  })
})
