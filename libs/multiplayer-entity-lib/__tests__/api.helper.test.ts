import * as Y from 'yjs'
import { ApiHelper, ApiTemplates } from '../src'
import ApiConverter from '../src/converters/api.converter'
import { OpenAPIV3 } from 'openapi-types'
import { ComponentsV2 } from '../src/setters/api/openapiv2.setters'

describe('Api helper', () => {
  let doc: Y.Doc
  beforeEach(() => {
    doc = ApiConverter.convertDataToYDoc(ApiTemplates.empty())
  })
  it('addComponent non-openapi', () => {
    doc = ApiConverter.convertDataToYDoc(ApiTemplates.empty('test', { contents: 'some text data' }))
    const component: {
      type: keyof OpenAPIV3.ComponentsObject | keyof ComponentsV2,
      key: string,
      data: Record<string, any>
    } = {
      type: 'schemas',
      key: 'TestSchema',
      data: {
        type: 'string',
      },
    }
    expect(() => ApiHelper.addComponent(doc,component)).toThrow()
  })

  it('addComponent openapiDoc v3', () => {
    const component: {
      type: keyof OpenAPIV3.ComponentsObject | keyof ComponentsV2,
      key: string,
      data: Record<string, any>
    } = {
      type: 'schemas',
      key: 'TestSchema',
      data: {
        type: 'string',
      },
    }
    const updatedDoc = ApiHelper.addComponent(doc, component)
    const apiObj = updatedDoc.getMap('object').toJSON()
    expect(apiObj.components).toBeDefined()
    expect(apiObj.components).toHaveProperty(`${component.type}:${component.key}`, component.data)
  })
  it('addPath openapiDoc v3', () => {
    const path = {
      pattern: 'test',
      method: 'get',
      object: {
        'summary': 'Test',
        'description': 'Test',
        'tags': [
          'test',
        ],
      },
    }
    const updatedDoc = ApiHelper.addPath(doc, path)
    const apiObj = updatedDoc.getMap('object').toJSON()
    expect(apiObj.paths).toBeDefined()
    expect(apiObj.paths).toHaveProperty(`${path.pattern}:${path.method}`, path.object)
  })
  it('addPath non-openapi', () => {
    doc = ApiConverter.convertDataToYDoc(ApiTemplates.empty('test', { contents: 'some text data' }))
    const path = {
      pattern: 'test',
      method: 'get',
      object: {},
    }
    expect(() => ApiHelper.addPath(doc,path)).toThrow()
  })

  it('updateDocTextWithOpenapiObject validObject', () => {
    const paths = {
      'test': {
        'get': {
          'summary': 'Test',
          'description': 'Test',
          'tags': [
            'test',
          ],
        },
      },
    }
    const updatedDoc = ApiHelper.updateDocTextWithOpenapiObject(
      doc,
      ApiTemplates.contentsTemplate({ paths }))
    let parsed
    try {
      parsed = JSON.parse(updatedDoc.getText('text').toJSON())
    } catch (err) {
      parsed = undefined
    }

    expect(parsed).toBeDefined()
    expect(parsed.paths).toHaveProperty('test', paths.test)
  })

  it('updateDocTextWithOpenapiObject invalidObject', () => {
    expect(() => ApiHelper.updateDocTextWithOpenapiObject(doc, {
      paths: 'invalid prop',
    })).toThrow()
  })
})
