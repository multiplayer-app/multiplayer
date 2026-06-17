import { IssueSeverityLevel } from './enums/issue-severity-level.enum'
import { MetricName } from './enums/metric-name.enum'
import { IssueCategoryEnum } from './enums/issue-category.enum'

export interface IIssue {
  _id?: string

  workspace: string
  project: string

  /**
   * @description hash - is unique hash for issue (endpoint + service version + environment + all other info)
   */
  hash: string
  /**
   * @description titleHash - is for grouping on dashboard + it's also used to filter issues
   */
  titleHash: string
  /**
   * @description componentHash - is for creating hash for issue in scope of service (component).
   * In case if issue has stacktrace - we will include it. If no - we will put issue metadata into hash
   */
  componentHash: string
  /**
   * @description customHash - user can manully put issue hash by setting attribute into span
   */
  customHash?: string

  // TODO: when grouping return max 5 unique items (services, environments, releases, etc)

  title: string

  resolved: boolean
  archived: boolean

  severity?: IssueSeverityLevel
  fixabilityScore?: number
  category: IssueCategoryEnum

  metadata: {
    culprit?: string
    message?: string
    stacktrace?: string

    spanKind: number

    httpTarget?: string
    httpUrl?: string
    httpRoute?: string
    httpMethod?: string

    // TODO: add metadata for grpc/rpc/db

    value?: string
    type?: string
    filename?: string
    function?: string
  }

  service: {
    serviceName: string
    serviceNameSlug: string

    release?: string
    environment?: string
    environmentSlug?: string


    // when grouping
    releases?: string[]
    environments?: string[]
    environmentsSlug?: string[]
  }

  metrics?: {
    [MetricName.ISSUE_RATE]?: { time: string, value: number }[]
    [MetricName.SESSION_RECORDING_RATE]?: { time: string, value: number }[]
  }

  solution?: {
    inProgress?: boolean
    agent?: string
    fixWithAgentFailed?: boolean
    gitBranch?: string
    gitRepositoryUrl?: string
    prUrl?: string
  }

  integration?: string

  lastSeen?: string | Date

  // only for agent
  url?: string

  createdAt?: string | Date
  updatedAt?: string | Date
}
