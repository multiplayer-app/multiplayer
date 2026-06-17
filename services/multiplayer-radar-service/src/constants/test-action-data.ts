import {
  IIssue,
  OtelSpanCh,
  IDebugSession,
  EndUserType,
  DebugSessionCreationReasonType,
  DebugSessionDataType,
  IssueCategoryEnum,
} from '@multiplayer/types'
import { SessionType } from '@multiplayer-app/session-recorder-common'

export const issue: IIssue = {
  metadata: {
    spanKind: 1,
    httpRoute: '/v0/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits/:entityCommitId/contents',
  },
  service: {
    serviceName: 'version',
    release: '0.0.1',
    environment: 'local',
    serviceNameSlug: 'version',
    environmentSlug: 'local',
  },
  _id: '692c90b36f69906d212424d7',
  hash: 'ebf4867d5c204e6a3d11ceca444dd276',
  titleHash: 'ebf4867d5c204e6a3d11ceca444dd276',
  archived: false,
  componentHash: '0d4c395902c030c78d491b2912c62ddb',
  lastSeen: '2025-11-30T18:45:07.784Z',
  project: '65109c67d4abb818be2e497d',
  resolved: false,
  category: IssueCategoryEnum.HTTP_CLIENT,
  title: 'Incoming request failed ',
  createdAt: new Date('2025-11-30T18:45:07.785Z'),
  updatedAt: new Date('2025-11-30T18:45:07.785Z'),
  workspace: '6491c2e98a1a2213633434bc',
}

export const span: OtelSpanCh = {
  id: '692c90b32650971a1dd88023',
  Timestamp: '2025-11-30T18:44:59.951Z',
  TraceId: 'debdeba4581cf3a94309a6063a4dcfff',
  SpanId: 'f438f2bbc693a1a3',
  ParentSpanId: '1f2d9b6734d8bac7',
  SpanName: 'request handler - /v0/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits/:entityCommitId/contents',
  SpanKind: 1,
  ServiceName: 'version',
  ResourceAttributes: {
    'process.pid': '15110',
    'process.executable.name': 'node',
    'process.executable.path': '/Users/dima/.nvm/versions/node/v22.13.1/bin/node',
    'process.command_args': {
      values: [
        {
          stringValue: '/Users/dima/Projects/multiplayer-platform/services/multiplayer-version-service/node_modules/.bin/ts-node',
        },
        {
          stringValue: '/Users/dima/Projects/multiplayer-platform/services/multiplayer-version-service/node_modules/ts-node/dist/bin.js',
        },
        {
          stringValue: '/Users/dima/Projects/multiplayer-platform/services/multiplayer-version-service/src/index.ts',
        },
      ],
    },
    'process.runtime.version': '22.13.1',
    'process.runtime.name': 'nodejs',
    'process.runtime.description': 'Node.js',
    'process.command': '/Users/dima/Projects/multiplayer-platform/services/multiplayer-version-service/src/index.ts',
    'process.owner': 'dima',
    'service.instance.id': '134e9999-e1f2-43cc-9f32-8e1934bacb11',
    'os.type': 'linux',
    'os.version': '24.6.0',
    'host.name': 'multiplayer-otel-collector',
    'host.arch': 'arm64',
    'host.id': '46F43923-C922-51E0-BB13-EE38F6875412',
    'service.name': 'version',
    'service.version': '0.0.1',
    'deployment.environment': 'local',
    'multiplayer.workspace.id': '6491c2e98a1a2213633434bc',
    'multiplayer.project.id': '65109c67d4abb818be2e497d',
    'multiplayer.integration.id': '676c89a0f092e3d9339456b5',
  },
  ScopeName: '@opentelemetry/instrumentation-express',
  ScopeVersion: '0.52.0',
  SpanAttributes: {
    'http.route': '/v0/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits/:entityCommitId/contents',
    'express.name': '/v0/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits/:entityCommitId/contents',
    'express.type': 'request_handler',
    'user.id': '64b17beb45e327e437a93205',
    'span.size': '1907',
    'multiplayer.workspace.id': '6491c2e98a1a2213633434bc',
    'multiplayer.project.id': '65109c67d4abb818be2e497d',
    'multiplayer.integration.id': '676c89a0f092e3d9339456b5',
    'multiplayer.issue.hash': 'ebf4867d5c204e6a3d11ceca444dd276',
    'multiplayer.issue.component-hash': '0d4c395902c030c78d491b2912c62ddb',
  },
  Duration: 12976896,
  StatusCode: 'ERROR',
  StatusMessage: 'THIS IS A TEST',
  Events: [
    {
      'Timestamp': '2025-11-30T18:44:59.963Z',
      'Name': 'exception',
      'Attributes': {
        'exception.type': 'BadRequest',
        'exception.message': 'THIS IS A TEST',
        'exception.stacktrace': 'BadRequestError: THIS IS A TEST\n    at exports.default (/Users/dima/Projects/multiplayer-platform/services/multiplayer-version-service/src/routes/entity-commit/get-contents.ts:15:13)\n    at Layer.handle [as handle_request] (/Users/dima/Projects/multiplayer-platform/node_modules/express/lib/router/layer.js:95:5)\n    at next (/Users/dima/Projects/multiplayer-platform/node_modules/express/lib/router/route.js:144:13)\n    at validateEntityCommitAccess (/Users/dima/Projects/multiplayer-platform/services/multiplayer-version-service/src/middleware/entity-commit.ts:99:10)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
      },
    },
  ],
  'Links': [],
}

export const debugSession: IDebugSession = {
  _id: '68efe7b49d6ca34b86b1c397',
  starred: false,
  sessionType: SessionType.MANUAL,
  creationReason: DebugSessionCreationReasonType.MANUAL,
  resourceAttributes: {
    'osInfo': 'MacOS 10.15',
    'screenSize': '2560x1440',
    'pixelRatio': '2',
    'deviceInfo': 'Desktop',
    'browserInfo': 'Google Chrome 141.0',
    'cookiesEnabled': 'Yes',
    'hardwareConcurrency': '12',
    'packageVersion': '1.2.1',
  } as any,
  'shortId': '99fd07ecb0bb9e0a',
  'project': '65109c67d4abb818be2e497d',
  'workspace': '6491c2e98a1a2213633434bc',
  'name': 'THROW_ERROR',
  'startedAt': new Date('2025-10-15T18:28:04.809+0000'),
  'tags': [],
  'sessionAttributes': {
    'comment': '',
    'userId': 'dmytro@multiplayer.app',
    'userName': 'dmytro@multiplayer.app',
  },
  'userAttributes': {
    type: EndUserType.USER,
    id: '12345678',
    name: 'John Doe',
    groupId: '12345678',
    groupName: 'Developers',

    userEmail: 'sample@example.com',
    userId: '12345678',
    userName: 'John Doe',
    accountId: '12345678',
    accountName: 'John Doe',
    orgId: '12345678',
    orgName: 'John Doe',
  },
  'createdAt': new Date('2025-10-15T18:28:04.810+0000'),
  'issues': [

  ],
  's3Files': [
    {
      'bucket': 'debug-sessions-bucket',
      'key': 'workspaces/6491c2e98a1a2213633434bc/projects/65109c67d4abb818be2e497d/debug-sessions/68efe7b49d6ca34b86b1c397/OTLP_LOGS/68efea2a7eb7f6e4d3bd65a7',
      'dataType': DebugSessionDataType.OTLP_LOGS,
      '_id': '68efea2a7eb7f6e4d3bd65a7',
    },
    {
      'bucket': 'debug-sessions-bucket',
      'key': 'workspaces/6491c2e98a1a2213633434bc/projects/65109c67d4abb818be2e497d/debug-sessions/68efe7b49d6ca34b86b1c397/OTLP_TRACES/68efea2b7eb7f6e4d3bd65aa',
      'dataType': DebugSessionDataType.OTLP_TRACES,
      '_id': '68efea2b7eb7f6e4d3bd65aa',
    },
    {
      'bucket': 'debug-sessions-bucket',
      'key': 'workspaces/6491c2e98a1a2213633434bc/projects/65109c67d4abb818be2e497d/debug-sessions/68efe7b49d6ca34b86b1c397/RRWEB_EVENTS/68efea2b7eb7f6e4d3bd65af',
      'dataType': DebugSessionDataType.RRWEB_EVENTS,
      '_id': '68efea2b7eb7f6e4d3bd65af',
    },
  ],
  'starredItems': [

  ],
  'updatedAt': new Date('2025-10-15T18:38:35.065+0000'),
  'views': [

  ],
  'durationInSeconds': 299.225,
  'stoppedAt': new Date('2025-10-15T18:33:04.034+0000'),
  'finishedS3Transfer': true,
}
