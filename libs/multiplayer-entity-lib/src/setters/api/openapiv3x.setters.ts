import { Setters } from '../setters'
import { OpenAPIV3 } from 'openapi-types'
import * as Y from 'yjs'
import { setObjectsToMap } from './helper'

export type PartialOpenapiV3x = Pick<OpenAPIV3.Document, 'paths' | 'components' | 'tags'>
export class Openapiv3xSetters implements Setters<PartialOpenapiV3x> {
  private yMap: Y.Map<unknown>

  constructor(doc: Y.Doc) {
    this.yMap = doc.getMap('object')
  }

  setFields(data: PartialOpenapiV3x): void {
    this.setComponents(data)
    this.setPaths(data)
    this.setTags(data)
  }

  setTags(data: PartialOpenapiV3x) {
    if (!this.yMap.has('tags')) {
      this.yMap.set('tags', new Y.Map<unknown>())
    }
    const tags: Y.Map<OpenAPIV3.TagObject> = this.yMap.get('tags') as Y.Map<OpenAPIV3.TagObject>
    const valuesMap: Record<string, OpenAPIV3.TagObject> = data.tags?.reduce((acc, currentValue)=> {
      acc[currentValue.name] = currentValue
      return acc
    }, {}) || {}

    tags.forEach((value, key) => {
      if (!valuesMap[key]) tags.delete(key)
    })
    Object.values(valuesMap).forEach((tag) => {
      tags.set(tag.name, tag)
    })
  }

  setPaths(data: PartialOpenapiV3x) {
    if (!this.yMap.has('paths')) {
      this.yMap.set('paths', new Y.Map<unknown>())
    }
    const paths: Y.Map<OpenAPIV3.OperationObject> =this.yMap.get('paths') as Y.Map<OpenAPIV3.OperationObject>
    paths.forEach((value, key) => {
      const [pattern, method] = key.split(':')
      if (!data.paths?.[pattern]?.[method]) paths.delete(key)
    })
    Object.keys(data.paths || {}).forEach((pattern) => {
      const summary = data.paths[pattern]?.summary
      const description = data.paths[pattern]?.description
      const parameters = data.paths[pattern]?.parameters

      Object.keys(OpenAPIV3.HttpMethods).forEach((methodKey) => {
        const method = OpenAPIV3.HttpMethods[methodKey]
        if (!data.paths[pattern]?.[method]) return

        const operation = data.paths[pattern]?.[method]
        if (summary) operation.summary = operation.summary || summary
        if (description) operation.description = operation.description || description
        if (parameters) {
          operation.parameters = Object.values([...(operation.parameters || []), ...parameters]
            .reduce((acc, param) => {
              acc[`${param.name}.${param.in}`] = param
              return acc
            }, {}))
        }
        const key = `${pattern}:${method}`
        paths.set(key, operation)
      })
    })
  }

  addPath(path: {
    pattern: string,
    method: string,
    object: any
  }) {
    if (!this.yMap.has('paths')) {
      this.yMap.set('paths', new Y.Map<unknown>())
    }
    const paths: Y.Map<OpenAPIV3.OperationObject> = this.yMap.get('paths') as Y.Map<OpenAPIV3.OperationObject>
    paths.set(`${path.pattern}:${path.method}`, path.object)
  }

  setComponents(data: PartialOpenapiV3x) {
    if (!this.yMap.has('components')) {
      this.yMap.set('components', new Y.Map<unknown>())
    }
    const components: Y.Map<unknown> = this.yMap.get('components') as Y.Map<unknown>
    const setters = new ComponentsSetters(components)
    setters.setFields(data.components || {})
  }

  addComponent(component: { type: string; key: string; data: Record<string, any> }) {
    if (!this.yMap.has('components')) {
      this.yMap.set('components', new Y.Map<unknown>())
    }
    const components: Y.Map<unknown> = this.yMap.get('components') as Y.Map<unknown>
    const helper = new ComponentsSetters(components)
    helper.addComponent(component)
  }
}

class ComponentsSetters implements Setters<OpenAPIV3.ComponentsObject> {
  private yMap: Y.Map<unknown>

  constructor(yMap: Y.Map<unknown>) {
    this.yMap = yMap
  }

  //type has to be keyof OpenAPIV3.ComponentsObject
  addComponent(component: { type: string; key: string; data: Record<string, any> }) {
    this.yMap.set(`${component.type}:${component.key}`, component.data)
  }
  setFields(data: OpenAPIV3.ComponentsObject): void {
    this.setCallbacks(data)
    this.setExamples(data)
    this.setHeaders(data)
    this.setLinks(data)
    this.setParameters(data)
    this.setRequestBodies(data)
    this.setResponses(data)
    this.setSchemas(data)
    this.setSecuritySchemes(data)
  }
  setCallbacks(data: OpenAPIV3.ComponentsObject): void {
    setObjectsToMap('callbacks', this.yMap, data.callbacks)
  }

  setExamples(data: OpenAPIV3.ComponentsObject): void {
    setObjectsToMap('examples', this.yMap, data.examples)
  }

  setHeaders(data: OpenAPIV3.ComponentsObject): void {
    setObjectsToMap('headers', this.yMap, data.headers)
  }

  setLinks(data: OpenAPIV3.ComponentsObject): void {
    setObjectsToMap('links', this.yMap, data.links)
  }

  setParameters(data: OpenAPIV3.ComponentsObject): void {
    setObjectsToMap('parameters', this.yMap, data.parameters)
  }

  setRequestBodies(data: OpenAPIV3.ComponentsObject): void {
    setObjectsToMap('requestBodies', this.yMap, data.requestBodies)
  }

  setResponses(data: OpenAPIV3.ComponentsObject): void {
    setObjectsToMap('responses', this.yMap, data.responses)
  }

  setSchemas(data: OpenAPIV3.ComponentsObject): void {
    setObjectsToMap('schemas', this.yMap, data.schemas)
  }

  setSecuritySchemes(data: OpenAPIV3.ComponentsObject): void {
    setObjectsToMap('securitySchemes', this.yMap, data.securitySchemes)
  }
}
