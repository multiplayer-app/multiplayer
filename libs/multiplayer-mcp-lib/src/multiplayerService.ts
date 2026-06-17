import { eventWithTime } from '@rrweb/types'
import {
  ILogData,
  ListDebugSessionsFilter,
  ListGroupedIssuesFilter,
  MultiplayerListResponse,
  ResolveIssuesParams,
  AuthType,
} from './interfaces'

import {
  DataWithCursor,
  DebugSessionDataType,
  DebugSessionNodeType,
  IDebugSession,
  IDebugSessionNode,
  IDebugSessionRrwebEvent,
  IIssue,
  ITraceData,
  OtelScope,
} from '@multiplayer/types'
import { unpack } from '@rrweb/packer'
import { newDebugSessionNode } from './utils'
import {
  MULTIPLAYER_BASE_API_URL,
  MULTIPLAYER_CLIENT_DOMAIN,
  MULTIPLAYER_REQUEST_TIMEOUT_MS,
} from './config'
import { EntityConverter } from '@multiplayer/entity'
import { NotesType } from '@multiplayer/types'
import crypto from 'crypto'

/**
 * Structured error for any failed outbound request the MCP server makes.
 * Carries enough context (status, timeout flag) for callers to decide whether
 * to degrade gracefully or surface a clear message to the connector.
 */
export class MultiplayerRequestError extends Error {
  constructor(
    message: string,
    public readonly options: { status?: number, isTimeout?: boolean, cause?: unknown } = {},
  ) {
    super(message)
    this.name = 'MultiplayerRequestError'
  }
}

export interface DebugSessionData {
  traces?: IDebugSessionNode<ITraceData>[]
  logs?: IDebugSessionNode<ILogData>[]
  rrwebEvents?: eventWithTime[]
  /** Human-readable reasons for any source that failed to load. */
  errors: string[]
}

export class MultiplayerService {
  private readonly baseApiUrl: string
  private readonly domain: string
  private readonly headers: Record<string, string> = {}
  private readonly workspace: string
  private readonly project: string

  constructor(params: {
    authKey: string,
    authType: AuthType,
    workspace: string,
    project: string,
  }, baseApiUrl = MULTIPLAYER_BASE_API_URL, domain = MULTIPLAYER_CLIENT_DOMAIN) {
    this.workspace = params.workspace
    this.project = params.project
    this.headers = this.getAuthHeader(params.authType, params.authKey)
    this.baseApiUrl = baseApiUrl
    this.domain = domain
  }

  private getAuthHeader(authType: AuthType, authKey): Record<string, string> {
    switch (authType) {
      case AuthType.API_KEY:
        return { 'x-api-key': authKey }
      case AuthType.OAUTH_TOKEN:
        return { Authorization: `Bearer ${authKey}` }
      default:
        return {}
    }
  }

  getDebugSessionById(id: string) {
    return this.get<IDebugSession>(`/v0/radar/workspaces/${this.workspace}/projects/${this.project}/debug-sessions/${id}`)
  }

  listDebugSessions(filter: ListDebugSessionsFilter) {
    return this.get<DataWithCursor<IDebugSession>>(`/v0/radar/workspaces/${this.workspace}/projects/${this.project}/debug-sessions`, filter)
  }

  getSessionUrl(debugSession: IDebugSession) {
    return `${this.domain}/project/${debugSession.workspace}/${debugSession.project}/default/debugger/session/${debugSession._id}`
  }

  getCurrentProjectUrl() {
    return `${this.domain}/project/${this.workspace}/${this.project}/default`
  }

  getIssueUrl(issue: Pick<IIssue, 'titleHash' | 'componentHash'>) {
    return `${this.domain}/project/${this.workspace}/${this.project}/default/issues/issue/${issue.titleHash}?componentHash=${issue.componentHash}`
  }

  listGroupedIssues(filter: ListGroupedIssuesFilter) {
    return this.get<DataWithCursor<IIssue>>(
      `/v0/radar/workspaces/${this.workspace}/projects/${this.project}/issues/grouped`,
      filter,
    )
  }

  getIssueByTitleHash(titleHash: string) {
    return this.get<IIssue>(
      `/v0/radar/workspaces/${this.workspace}/projects/${this.project}/issues/hash/title/${titleHash}`,
    )
  }

  resolveIssues({ titleHashes, resolved = true, archived = false }: ResolveIssuesParams) {
    return this.patch<IIssue[]>(
      `/v0/radar/workspaces/${this.workspace}/projects/${this.project}/issues/bulk`,
      {
        filter: { titleHash: titleHashes },
        payload: { resolved, archived },
      },
    )
  }

  async getDebugSessionTraces(debugSession: IDebugSession): Promise<IDebugSessionNode<ITraceData>[] | undefined> {
    const tracesFile = debugSession.s3Files?.find(
      ({ dataType }) => dataType === DebugSessionDataType.OTLP_TRACES,
    )

    let traces
    if (tracesFile?.url) {
      traces = await this.getS3Data(tracesFile?.url)
    } else {
      const response = await this.getOtelTraces(debugSession._id)
      traces = response?.data
    }
    if (!traces) return undefined

    return traces
      ?.map((t: ITraceData) =>
        t.ScopeName === OtelScope.userInteraction
          ? newDebugSessionNode<ITraceData>(DebugSessionNodeType.Event, t)
          : newDebugSessionNode<ITraceData>(DebugSessionNodeType.Trace, t),
      )
      .sort((a: IDebugSessionNode<any>, b: IDebugSessionNode<any>) => a.timestamp - b.timestamp)
  }

  async getDebugSessionLogs(debugSession: IDebugSession): Promise<IDebugSessionNode<ILogData>[] | undefined> {
    const logFile = debugSession.s3Files?.find(
      ({ dataType }) => dataType === DebugSessionDataType.OTLP_LOGS,
    )

    let logs
    if (logFile?.url) {
      logs = await this.getS3Data(logFile?.url)
    } else {
      const response = await this.getOtelLogs(debugSession._id)
      logs = response?.data
    }
    if (!logs) return undefined
    return logs.map((log: ILogData) => newDebugSessionNode<eventWithTime>(DebugSessionNodeType.Log, log))
  }

  /**
   * Fetch traces, logs and rrweb events concurrently. Uses allSettled so a
   * failure (or timeout) in one source does not abort the others — callers get
   * whatever loaded plus a list of human-readable errors for the rest.
   */
  async getDebugSessionData(debugSession: IDebugSession): Promise<DebugSessionData> {
    const [tracesResult, logsResult, rrwebResult] = await Promise.allSettled([
      this.getDebugSessionTraces(debugSession),
      this.getDebugSessionLogs(debugSession),
      this.getDebugSessionRrwebEvents(debugSession),
    ])

    const errors: string[] = []
    const pick = <T>(result: PromiseSettledResult<T>, label: string): T | undefined => {
      if (result.status === 'fulfilled') return result.value
      const reason = result.reason
      errors.push(`${label}: ${reason instanceof Error ? reason.message : String(reason)}`)
      return undefined
    }

    return {
      traces: pick(tracesResult, 'traces'),
      logs: pick(logsResult, 'logs'),
      rrwebEvents: pick(rrwebResult, 'rrwebEvents'),
      errors,
    }
  }
  private getBase64Hash(base64: string | Buffer) {
    return crypto.createHash('sha256').update(base64).digest('hex')
  }
  private validateBase64Image(dataUri: string) {
    if (!dataUri) return null

    // 1. Check prefix format
    const regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/
    const match = dataUri.match(regex)
    if (!match) {
      return null // not valid data URI image
    }

    // 2. Extract mime type and base64 payload
    const mimeType = `image/${match[1]}`
    const data = dataUri.replace(regex, '')

    return {
      mimeType,
      data,
    }
  }

  async getNotesContent(id: string) {
    const note = await this.get<{
      content: Record<string, any>, imageUrls: string[]
    }>(`/v0/assets/workspaces/${this.workspace}/projects/${this.project}/debug-sessions/${id}/notes/content`)

    const images = await Promise.all(note.imageUrls.map((url: string) => {
      const match = url.match(/\/images\/[^/]+?-([^.]+)\.jpeg/i)
      const id = match ? match[1] : ''
      return this.getS3Data(url, true).then((image) => ({ id, image }))
    }))
    const imagesMap = images.reduce((acc, image) => {
      acc[image.id] = image.image
      return acc
    }, {})
    const resources: any[] = []
    const md = EntityConverter.stringifyData(NotesType.SESSION, note.content, {
      processBlockContent: (content: string, blockId?: string) => {
        resources.push({
          type: 'text' as const,
          text: content,
          mimeType: 'text/markdown',
          annotations: {
            priority: blockId ? 1 : 0.5,
            audience: ['user', 'assistant'],
          },
        })
        if (blockId) {
          const image = imagesMap[blockId]
          if (image) {
            resources.push({
              type: 'image' as const,
              data: Buffer.from(image).toString('base64'),
              mimeType: 'image/jpeg',
              _meta: {
                description: content,
                title: content,
              },
              annotations: {
                priority: 1,
                audience: ['user', 'assistant'],
              },
            })
          }
        }
        return content
      },
      getImageUrl: (imageDataUri: string, description?: string, title?: string) => {
        const imgData = this.validateBase64Image(imageDataUri)
        if (imgData) {
          const hash = this.getBase64Hash(imgData.data)
          const key = `resource_${hash}`

          resources.push({
            type: 'image' as const,
            data: imgData.data,
            mimeType: imgData.mimeType,
            name: title,
            description,
            title,
            annotations: {
              audience: ['user', 'assistant'],
            },
          })

          return `image:${key}`
        }
        return ''
      },
    })
    return {
      md,
      resources,
    }
  }

  async getDebugSessionRrwebEvents(debugSession: IDebugSession): Promise<eventWithTime[] | undefined> {
    const eventsFile = debugSession.s3Files?.find(
      ({ dataType }) => dataType === DebugSessionDataType.RRWEB_EVENTS,
    )

    let events: IDebugSessionRrwebEvent[] | undefined
    if (eventsFile?.url) {
      events = await this.getS3Data(eventsFile?.url)
    } else {
      const response = await this.getRrwebEvents(debugSession._id)
      events = response?.data
    }

    if (!events) {
      return undefined
    }

    return events.map((event) => unpack(event.data))
  }

  async getIssueDebugContext(componentHash: string) {
    const response = await this.listDebugSessions({
      issueComponentHash: componentHash,
      limit: 1,
      sortKey: 'createdAt',
      sortDirection: -1,
    })
    const debugSession = response?.data?.[0]
    if (!debugSession) return null

    const [traces, logs] = await Promise.all([
      this.getDebugSessionTraces(debugSession),
      this.getDebugSessionLogs(debugSession),
    ])

    return { debugSession, traces, logs }
  }

  async getOtelTraces(id: string, skip = 0, limit: number = 300) {
    return this.get<MultiplayerListResponse<ITraceData>>(`/v0/radar/workspaces/${this.workspace}/projects/${this.project}/debug-sessions/${id}/otel-traces`, { skip, limit })
  }

  async getOtelLogs(id: string, skip = 0, limit: number = 300) {
    return this.get<MultiplayerListResponse<ILogData>>(`/v0/radar/workspaces/${this.workspace}/projects/${this.project}/debug-sessions/${id}/otel-logs`, { skip, limit })
  }

  async getRrwebEvents(id: string, skip = 0, limit: number = 300) {
    return this.get<MultiplayerListResponse<IDebugSessionRrwebEvent>>(`/v0/radar/workspaces/${this.workspace}/projects/${this.project}/debug-sessions/${id}/rrweb-events`, { skip, limit })
  }

  async getS3Data(url: string, isBuffer = false) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(MULTIPLAYER_REQUEST_TIMEOUT_MS) })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      if (isBuffer) {
        return (await response.arrayBuffer())
      }
      return (await response.json())
    } catch (error) {
      // eslint-disable-next-line
      console.error('Error fetching Multiplayer S3 data:', error)
      return null
    }
  }

  async get<T>(url: string, params: Record<string, any> = {}): Promise<T> {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value),
        ]),
    ).toString()
    const fullUrl = `${this.baseApiUrl}${url}${queryString ? `?${queryString}` : ''}`

    let response: Response
    try {
      response = await fetch(fullUrl, {
        headers: this.headers,
        signal: AbortSignal.timeout(MULTIPLAYER_REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      const isTimeout = (error as Error)?.name === 'TimeoutError'
      // eslint-disable-next-line
      console.error('Error making Multiplayer request:', error)
      throw new MultiplayerRequestError(
        isTimeout
          ? `Request to ${url} timed out after ${MULTIPLAYER_REQUEST_TIMEOUT_MS}ms`
          : `Network error while requesting ${url}`,
        { isTimeout, cause: error },
      )
    }

    if (!response.ok) {
      throw new MultiplayerRequestError(
        `Request to ${url} failed with status ${response.status}`,
        { status: response.status },
      )
    }

    try {
      return (await response.json()) as T
    } catch (error) {
      throw new MultiplayerRequestError(`Invalid JSON response from ${url}`, { cause: error })
    }
  }

  async patch<T>(url: string, body: Record<string, any>): Promise<T> {
    const fullUrl = `${this.baseApiUrl}${url}`

    let response: Response
    try {
      response = await fetch(fullUrl, {
        method: 'PATCH',
        headers: {
          ...this.headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(MULTIPLAYER_REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      const isTimeout = (error as Error)?.name === 'TimeoutError'
      // eslint-disable-next-line
      console.error('Error making Multiplayer request:', error)
      throw new MultiplayerRequestError(
        isTimeout
          ? `Request to ${url} timed out after ${MULTIPLAYER_REQUEST_TIMEOUT_MS}ms`
          : `Network error while requesting ${url}`,
        { isTimeout, cause: error },
      )
    }

    if (!response.ok) {
      throw new MultiplayerRequestError(
        `Request to ${url} failed with status ${response.status}`,
        { status: response.status },
      )
    }

    try {
      return (await response.json()) as T
    } catch (error) {
      throw new MultiplayerRequestError(`Invalid JSON response from ${url}`, { cause: error })
    }
  }
}