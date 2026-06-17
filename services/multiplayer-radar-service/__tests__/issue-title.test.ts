import { IIssue, IssueCategoryEnum } from '@multiplayer/types'
import {
  getIssueTitle,
  normalizeString,
} from '../src/libs/otlp.lib'

describe('Get issue title', () => {
  it('should return the correct title for outgoing request', () => {
    const issue: Partial<IIssue> = {
      _id: '698d918f1ecc944783eae813',
      hash: '6b1f40396e49b32ae2dec86e5e7f2eca',
      archived: false,
      category: IssueCategoryEnum.EXCEPTION,
      componentHash: '997a7ec9ffcc2e0629ba995d187309df',
      createdAt: new Date('2026-02-12T08:38:39.938+0000'),
      lastSeen: new Date('2026-02-12T08:38:39.938+0000'),
      metadata: {
        spanKind: 1,
        'httpTarget': '',
        httpUrl: '',
        httpRoute: '/v0/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits/:entityCommitId/contents',
        stacktrace: 'BadRequestError: THIS IS A TEST\n    at exports.default (/Users/dima/Projects/multiplayer-platform/services/multiplayer-version-service/src/routes/entity-commit/get-contents.ts:20:13)\n    at Layer.handle [as handle_request] (/Users/dima/Projects/multiplayer-platform/node_modules/express/lib/router/layer.js:95:5)\n    at next (/Users/dima/Projects/multiplayer-platform/node_modules/express/lib/router/route.js:144:13)\n    at validateEntityCommitAccess (/Users/dima/Projects/multiplayer-platform/services/multiplayer-version-service/src/middleware/entity-commit.ts:99:10)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
        message: 'THIS IS A TEST',
        type: 'BadRequest',
      },
      project: '65109c67d4abb818be2e497d',
      resolved: false,
      service: {
        serviceName: 'version',
        release: '0.0.1',
        environment: 'local',
        serviceNameSlug: 'version',
        environmentSlug: 'local',
      },
      // title: 'THIS IS A TEST',
      titleHash: 'cc20f92aba86833b606579a246056537',
      updatedAt: new Date('2026-02-12T08:38:39.938+0000'),
      workspace: '6491c2e98a1a2213633434bc',
    }

    const title = getIssueTitle(issue)
    expect(title).toBe('THIS IS A TEST')
  })

  it('should return the correct title for outgoing request 2', () => {
    const issue: Partial<IIssue> = {
      _id: '691b2dc4e891a1e6dac9034a',
      hash: '6b2d7a39e5052e41764a19695e284ca0',
      archived: false,
      componentHash: '3c7eb5b5bd0b2ce75167069fe36fe4ec',
      createdAt: new Date('2025-11-17T14:14:28.449+0000'),
      lastSeen: new Date('2025-11-17T14:14:28.449+0000'),
      metadata: {
        spanKind: 3,
        httpTarget: '/v1/epoch-engine/epoch',
        httpUrl: 'http://multiplayer-production-epoch-engine:3000/v1/epoch-engine/epoch',
        httpMethod: 'GET',
      },
      project: '682dcad6dc2e744b02775ce1',
      resolved: false,
      service: {
        serviceName: 'timegate',
        serviceNameSlug: 'timegate',
      },
      updatedAt: new Date('2025-11-17T14:14:28.449+0000'),
      workspace: '682dcaa2ac6fd313df0be21e',
    }

    const title = getIssueTitle(issue)
    expect(title).toBe('Outgoing request failed GET /v1/epoch-engine/epoch')
  })

  it('should return the correct title for outgoing request 3', () => {
    const issue: Partial<IIssue> = {
      _id: '691b2dc4e891a1e6dac9034a',
      hash: '6b2d7a39e5052e41764a19695e284ca0',
      archived: false,
      componentHash: '3c7eb5b5bd0b2ce75167069fe36fe4ec',
      createdAt: new Date('2025-11-17T14:14:28.449+0000'),
      lastSeen: new Date('2025-11-17T14:14:28.449+0000'),
      metadata: {
        spanKind: 2,
        culprit: 'POST /v1/timegate',
        httpTarget: '/v1/timegate/dialogue-hub/openrouter/message?errorRate=0.5',
        httpUrl: 'http://api.demo.multiplayer.app/v1/timegate/dialogue-hub/openrouter/message?errorRate=0.5',
        httpMethod: 'POST',
        httpRoute: '/v1/timegate',
      },
      project: '682dcad6dc2e744b02775ce1',
      resolved: false,
      service: {
        serviceName: 'timegate',
        serviceNameSlug: 'timegate',
      },
      updatedAt: new Date('2025-11-17T14:14:28.449+0000'),
      workspace: '682dcaa2ac6fd313df0be21e',
    }

    const title = getIssueTitle(issue)
    expect(title).toBe('Incoming request failed POST /v1/timegate/dialogue-hub/openrouter/message?errorRate={errorRate}')
  })


  it('should return the correct title for outgoing request 4', () => {
    const issue: Partial<IIssue> = {
      _id: '69336429c25fe8db94db4955',
      hash: '70dcccdf92956335cdab0849fcec7d7f',
      archived: false,
      category: IssueCategoryEnum.ERROR,
      componentHash: '81404ae896055d08d41cd4200d420c30',
      createdAt: new Date('2025-12-05T23:00:57.060+0000'),
      lastSeen: new Date('2025-12-05T23:00:57.060+0000'),
      metadata: {
        'spanKind': 1,
        'httpRoute': '/api/dc/:denominator',
        'stacktrace': 'TypeError: Cannot read properties of undefined (reading \'active\')\n    at handleDc (/var/www/math-toys-node/src/controllers/mathController.js:25:19)\n    at Layer.handleRequest (/var/www/math-toys-node/node_modules/router/lib/layer.js:152:17)\n    at next (/var/www/math-toys-node/node_modules/router/lib/route.js:157:13)\n    at /var/www/math-toys-node/src/routes/mathRoutes.js:15:5\n    at AsyncLocalStorage.run (node:async_hooks:346:14)\n    at AsyncLocalStorageContextManager.with (/var/www/math-toys-node/node_modules/@opentelemetry/context-async-hooks/build/src/AsyncLocalStorageContextManager.js:33:40)\n    at ContextAPI.with (/var/www/math-toys-node/node_modules/@opentelemetry/api/build/src/api/context.js:60:46)\n    at Tracer.startActiveSpan (/var/www/math-toys-node/node_modules/@opentelemetry/sdk-trace-node/node_modules/@opentelemetry/sdk-trace-base/build/src/Tracer.js:140:32)\n    at withComputeSpan (/var/www/math-toys-node/src/routes/mathRoutes.js:10:10)\n    at Layer.handleRequest (/var/www/math-toys-node/node_modules/router/lib/layer.js:152:17)',
        'message': 'Cannot read properties of undefined (reading \'active\')',
        'type': 'TypeError',
      },
      project: '68c20a4a7b7932727634c228',
      resolved: false,
      service: {
        serviceName: 'math-toys',
        release: '1.0.0',
        environment: 'production',
        serviceNameSlug: 'math-toys',
        environmentSlug: 'production',
      },
      updatedAt: new Date('2025-12-05T23:00:57.060+0000'),
      workspace: '68c20a48ec9359d8d5d428f9',
    }

    const title = getIssueTitle(issue)
    expect(title).toBe('Cannot read properties of undefined (reading \'active\')')
  })

  it('should return the correct title for outgoing request 5', () => {
    const issue: Partial<IIssue> = {
      _id: '698dbf84f02f73e5f374bba6',
      hash: '125c875797a769c1b0d93006f4c01085',
      archived: false,
      category: IssueCategoryEnum.EXCEPTION,
      componentHash: '65b5c05a247a0a6e711e4cc81aa9c50b',
      createdAt: new Date('2026-02-12T11:54:44.235+0000'),
      lastSeen: new Date('2026-02-12T13:24:12.465+0000'),
      metadata: {
        spanKind: 1,
        httpTarget: '',
        httpUrl: '',
        httpRoute: '/v1',
        stacktrace: '{id}: The token with accessToken: {uuid} is not found.\n    at /usr/src/services/ramp-web-api/src/microservice/{id}',
        message: 'The token with accessToken: {uuid} is not found.',
        type: 'MicroserviceError',
      },
      project: '65eb3a4b8d300db3da024199',
      resolved: false,
      service: {
        serviceName: 'ramp-web-api',
        release: 'main-b05aebd',
        environment: 'prod',
        serviceNameSlug: 'ramp-web-api',
        environmentSlug: 'prod',
      },
      title: 'The token with accessToken: {uuid} is not found.',
      titleHash: '06cf8c8b6f4bff84c7d83f5f1c1c99dc',
      updatedAt: new Date('2026-02-12T13:24:12.466+0000'),
      workspace: '64d62ca887b00d1d828f2bee',
    }

    const title = getIssueTitle(issue)
    expect(title).toBe('The token with accessToken: {uuid} is not found.')
  })


  it('should return the correct title for outgoing request 6', () => {
    const issue: Partial<IIssue> = {
      _id: '691b2dc4e891a1e6dac9034a',
      hash: '6b2d7a39e5052e41764a19695e284ca0',
      archived: false,
      componentHash: '3c7eb5b5bd0b2ce75167069fe36fe4ec',
      createdAt: new Date('2025-11-17T14:14:28.449+0000'),
      lastSeen: new Date('2025-11-17T14:14:28.449+0000'),
      metadata: {
        spanKind: 3,
        // httpTarget: '/v1/epoch-engine/epoch',
        httpUrl: 'https://smba.trafficmanager.net/amer/v3/conversations/19%3AAhKNwb5Mzvpfwuz13K4zNTadgrgrskrTFoQaf7GohoA1%40thread.tacv2/activities/%7Buuid%7D?skip=1&limit=10',
        httpMethod: 'GET',
      },
      project: '682dcad6dc2e744b02775ce1',
      resolved: false,
      service: {
        serviceName: 'timegate',
        serviceNameSlug: 'timegate',
      },
      updatedAt: new Date('2025-11-17T14:14:28.449+0000'),
      workspace: '682dcaa2ac6fd313df0be21e',
    }

    const title = getIssueTitle(issue)
    expect(title).toBe('Outgoing request failed GET https://smba.trafficmanager.net/amer/v3/conversations/{id}.tacv2/activities/{uuid}?limit={limit}&skip={skip}')
  })

  it('should return the correct title for outgoing request 7', () => {
    const issue: Partial<IIssue> = {
      hash: 'd627ed6d7360d09fdbc8725c8d8cec70',
      titleHash: 'c6942e6eac6f35104bed921e2ad7cf6b',
      title: 'socket hang up',
      resolved: false,
      archived: false,
      // 'severity': null,
      metadata: {
        spanKind: 3,
        httpTarget: '/{mongoId}/supportings/{mongoId}/attachments/{mongoId}/meta/text.txt?x-id=PutObject',
        httpUrl: 'https://{id}/{mongoId}/supportings/{mongoId}/attachments/{mongoId}/meta/text.txt?x-id=PutObject',
        httpMethod: 'PUT',
        httpRoute: '',
        stacktrace: 'Error: socket hang up\\n    at {id} (node:_http_client:598:25)\\n    at TLSSocket.emit (node:events:531:35)\\n    at TLSSocket.emit (node:domain:489:12)\\n    at {id} (/usr/src/node_modules/.pnpm/newrelic@{version}/node_modules/newrelic/lib/shim/shim.js:{numId}:20)\\n    at {id} (node:internal/async_local_storage/async_hooks:80:14)\\n    at {id} (/usr/src/node_modules/.pnpm/newrelic@{version}/node_modules/newrelic/lib/context-manager/async-local-context-manager.js:62:38)\\n    at {id} (/usr/src/node_modules/.pnpm/newrelic@{version}/node_modules/newrelic/lib/transaction/tracer/index.js:208:37)\\n    at {id} (/usr/src/node_modules/.pnpm/newrelic@{version}/node_modules/newrelic/lib/shim/shim.js:{numId}:66)\\n    at {id} [as emit] (/usr/src/node_modules/.pnpm/newrelic@{version}/node_modules/newrelic/lib/shim/shim.js:{numId}:17)\\n    at endReadableNT (node:internal/streams/readable:{numId}:12)\\n    at {id} (node:internal/process/task_queues:90:21)',
        message: 'socket hang up',
        type: 'ECONNRESET',
      },
      category: IssueCategoryEnum.EXCEPTION,
      lastSeen: '2026-02-12T14:39:54.222Z',
      createdAt: '2026-02-12T14:39:54.223Z',
      updatedAt: '2026-02-12T14:39:54.223Z',
      _id: '698de63af02f73e5f374bc0e',
      componentHash: 'c6942e6eac6f35104bed921e2ad7cf6b',
      service: {
        serviceName: 'timegate',
        serviceNameSlug: 'timegate',
      },
    }

    const title = getIssueTitle(issue)
    expect(title).toBe('socket hang up')
  })

  it('should normalize numeric array index in validation path', () => {
    const string = '"body.companiesRateData[0].minChange" must be a number'

    const normalized = normalizeString(string)
    expect(normalized).toBe('"body.companiesRateData[{numId}].minChange" must be a number')
  })

  it('should correctly normalize url 1', () => {

    const url = 'http://metadata.google.internal/computeMetadata/v1/instance/?recursive=true'

    const normalized = normalizeString(url)
    expect(normalized).toBe('http://metadata.google.internal/computeMetadata/v1/instance/?recursive={recursive}')
  })


  it('should correctly normalize url 2', () => {

    const url = 'PUT https://go.multiplayer.app/698e2e640e035a7954985a17/supportings/698e2e6f9d130b0a74725592/attachments/698e2e8060b6b194657f824b/meta/text.txt?x-id=PutObject'

    const normalized = normalizeString(url)
    expect(normalized).toBe('PUT https://go.multiplayer.app/{mongoId}/supportings/{mongoId}/attachments/{mongoId}/meta/{id}.txt?x-id={x-id}')
  })


  it('should normalize multiple numeric array indices in nested validation path', () => {
    const string = '"body.filters[0].value[0]" must only contain hexadecimal characters'

    const normalized = normalizeString(string)
    expect(normalized).toBe('"body.filters[{numId}].value[{numId}]" must only contain hexadecimal characters')
  })


  it('should correctly normalize url 3', () => {

    const url = 'http://framp-prod-auth-service:3050/v1/auth/authorization'

    const normalized = normalizeString(url)
    expect(normalized).toBe('http://framp-prod-auth-service:{numId}/v1/auth/authorization')
  })

  it('should correctly normalize url 4', () => {

    const url = 'https://framp-prod-auth-service:3050/v1/auth/authorization'

    const normalized = normalizeString(url)
    expect(normalized).toBe('https://framp-prod-auth-service:{numId}/v1/auth/authorization')
  })

  it('should correctly normalize url 5', () => {

    const url = 'https://framp-prod-auth-service/v1/auth/authorization'

    const normalized = normalizeString(url)
    expect(normalized).toBe('https://framp-prod-auth-service/v1/auth/authorization')
  })

  it('should correctly normalize url 6', () => {

    const url = 'framp-prod-auth-service/v1/auth/authorization'

    const normalized = normalizeString(url)
    expect(normalized).toBe('framp-prod-auth-service/v1/auth/authorization')
  })

  it('should correctly normalize url 7', () => {

    const url = 'framp-prod-auth-service:3050/v1/auth/authorization'

    const normalized = normalizeString(url)
    expect(normalized).toBe('framp-prod-auth-service:{numId}/v1/auth/authorization')
  })

  it('should correctly normalize url 8', () => {

    const url = 'PUT /go.multiplayer.app/698e2e640e035a7954985a17/supportings/698e2e6f9d130b0a74725592/attachments/698e2e8060b6b194657f824b/meta/text.txt?x-id=PutObject'

    const normalized = normalizeString(url)
    expect(normalized).toBe('PUT /go.multiplayer.app/{mongoId}/supportings/{mongoId}/attachments/{mongoId}/meta/{id}.txt?x-id={x-id}')
  })

  it('should correctly normalize url 9', () => {

    const url = 'PUT /go.multiplayer.app/698e2e640e035a7954985a17/supportings/698e2e6f9d130b0a74725592/attachments/698e2e8060b6b194657f824b/meta/text.txt?x-id=PutObject'

    const normalized = normalizeString(url)
    expect(normalized).toBe('PUT /go.multiplayer.app/{mongoId}/supportings/{mongoId}/attachments/{mongoId}/meta/{id}.txt?x-id={x-id}')
  })

  it('should correctly normalize url 10', () => {

    const url = '/go.multiplayer.app/698e2e640e035a7954985a17/supportings/698e2e6f9d130b0a74725592/attachments/698e2e8060b6b194657f824b/meta/text.txt?x-id=PutObject'

    const normalized = normalizeString(url)
    expect(normalized).toBe('/go.multiplayer.app/{mongoId}/supportings/{mongoId}/attachments/{mongoId}/meta/{id}.txt?x-id={x-id}')
  })

  it('should correctly normalize url 11', () => {

    const url = '/698e2e640e035a7954985a17/supportings/698e2e6f9d130b0a74725592/attachments/698e2e8060b6b194657f824b/meta/text.txt?x-id=PutObject'

    const normalized = normalizeString(url)
    expect(normalized).toBe('/{mongoId}/supportings/{mongoId}/attachments/{mongoId}/meta/{id}.txt?x-id={x-id}')
  })

  it('should correctly normalize string', () => {
    const title = 'Cast to ObjectId failed for value "0" (type number) at path "_id" for model "Inbox-Events"'


    const normalized = normalizeString(title)
    expect(normalized).toBe('Cast to ObjectId failed for value "{numId}" (type number) at path "_id" for model "Inbox-Events"')
  })


  it('should correctly normalize string', () => {
    const title = 'Given transaction number 1 on session {uuid} - {id}= -  -  using txnRetryCounter 0 does not match any in-progress transactions. The active transaction number is -1'

    const normalized = normalizeString(title)
    expect(normalized).toBe('Given transaction number {numId} on session {uuid} - {id}= -  -  using txnRetryCounter {numId} does not match any in-progress transactions. The active transaction number is {numId}')
  })

  it('should correctly normalize string', () => {
    const title = 'Transaction with { txnNumber: 3 } has been aborted.'

    const normalized = normalizeString(title)
    expect(normalized).toBe('Transaction with { txnNumber: {numId} } has been aborted.')
  })

  it('should correctly normalize string', () => {
    const title = 'Transaction with { txnNumber: "3" } has been aborted.'

    const normalized = normalizeString(title)
    expect(normalized).toBe('Transaction with { txnNumber: "{numId}" } has been aborted.')
  })

  it('should correctly normalize string', () => {
    const title = '"body.filters[{id}].value" must contain less than or equal to 100 items'

    const normalized = normalizeString(title)
    expect(normalized).toBe('"body.filters[{id}].value" must contain less than or equal to {numId} items')
  })
})
