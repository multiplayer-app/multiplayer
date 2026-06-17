import ApiConverter from '../src/converters/api.converter'
import { ApiType } from '@multiplayer/types'
import { ApiHelper, ApiTemplates } from '../src'

const validYamlStr = `
asyncapi: 2.6.0
info:
  title: Test Service
  version: 1.0.0`

const validJson = {
  asyncapi: '2.6.0',
  info: {
    title: 'Test Service',
    version: '1.0.0',
  },
}
const validJsonStr = JSON.stringify(validJson)
describe('ApiHelper unit tests', () => {
  describe('#fetchMetadata', () => {
    it('graphql', () => {
      const data = {
        ...ApiTemplates.empty('test'),
        extension: 'graphql',
        contents: 'smth',
        mpVersion: 0,
      }
      const res = ApiHelper.fetchMetadata(data.extension, data.contents, undefined)
      expect(res.provider).toEqual(ApiType.GRAPHQL)
    })
    it('grpc', () => {
      const data = {
        ...ApiTemplates.empty('test'),
        extension: 'proto',
        contents: 'smth',
        mpVersion: 0,
      }

      const res = ApiHelper.fetchMetadata(data.extension, data.contents, undefined)

      expect(res.provider).toEqual(ApiType.GRPC)
    })
    it('asyncapi', () => {
      const data = {
        ...ApiTemplates.empty('test'),
        extension: 'yaml',
        contents: validYamlStr,
        mpVersion: 0,
      }

      const res = ApiHelper.fetchMetadata(data.extension, data.contents, undefined)
      expect(res.provider).toEqual(ApiType.ASYNCAPI)
    })
    it('openapi', () => {
      const contents = { openapi: '1.2' }
      const data = {
        ...ApiTemplates.empty('test'),
        extension: 'json',
        mpVersion: 0,
        contents: JSON.stringify(contents),
      }
      const res = ApiHelper.fetchMetadata(data.extension, data.contents, contents)
      expect(res.provider).toEqual(ApiType.OPENAPI)
    })
    it('other', () => {
      const data = {
        ...ApiTemplates.empty('test'),
        extension: 'txt',
        contents: 'test string',
        mpVersion: 0,
      }
      const res = ApiHelper.fetchMetadata(data.extension, data.contents, undefined)
      expect(res.provider).toEqual(ApiType.OTHER)
    })
  })
})
