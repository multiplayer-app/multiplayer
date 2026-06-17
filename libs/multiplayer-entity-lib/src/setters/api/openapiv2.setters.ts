import { Setters } from '../setters'
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types'
import * as Y from 'yjs'
import { setObjectsToMap } from './helper'
import { v2toV3typesMap } from './openapiv2YMap.setters'

export type PartialOpenapiV2 = Pick<OpenAPIV2.Document,
'definitions' |
'paths' |
'tags' |
'parameters' |
'responses' |
'securityDefinitions'>

export type ComponentsV2 = {
  definitions?: OpenAPIV2.DefinitionsObject,
  parameters?: OpenAPIV2.ParametersDefinitionsObject,
  responses?: OpenAPIV2.ResponsesDefinitionsObject,
  securityDefinitions?: OpenAPIV2.SecurityDefinitionsObject,
}
export class Openapiv2Setters implements Setters<PartialOpenapiV2> {
  private yMap: Y.Map<unknown>

  constructor(doc: Y.Doc) {
    this.yMap = doc.getMap('object')
  }
  setFields(data: PartialOpenapiV2): void {
    this.setPaths(data)
    this.setTags(data)
    this.setComponents(data)
  }

  addPath(path: {
    pattern: string,
    method: string,
    object: any
  }) {
    if (!this.yMap.has('paths')) {
      this.yMap.set('paths', new Y.Map<unknown>())
    }
    const paths: Y.Map<OpenAPIV2.OperationObject> = this.yMap.get('paths') as Y.Map<OpenAPIV2.OperationObject>
    paths.set(`${path.pattern}:${path.method}`, path.object)
  }

  // type has to be keyof ComponentsV2
  addComponent(component: { type: string; key: string; data: Record<string, any> }) {
    if (!this.yMap.has('components')) {
      this.yMap.set('components', new Y.Map<unknown>())
    }
    const components = this.yMap.get('components') as Y.Map<unknown>
    const setters = new ComponentSetters(components)
    setters.addComponent(component)
  }

  setComponents(data: PartialOpenapiV2) {
    if (!this.yMap.has('components')) {
      this.yMap.set('components', new Y.Map<unknown>())
    }
    const components = this.yMap.get('components') as Y.Map<unknown>
    const setters = new ComponentSetters(components)
    setters.setFields(data)
  }

  setTags(data: PartialOpenapiV2) {
    if (!this.yMap.has('tags')) {
      this.yMap.set('tags', new Y.Map<unknown>())
    }
    const tags: Y.Map<OpenAPIV2.TagObject> = this.yMap.get('tags') as Y.Map<OpenAPIV2.TagObject>
    const valuesMap: Record<string, OpenAPIV2.TagObject> = data.tags?.reduce((acc, currentValue)=> {
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
  setPaths(data: PartialOpenapiV2) {
    if (!this.yMap.has('paths')) {
      this.yMap.set('paths', new Y.Map<unknown>())
    }
    const paths: Y.Map<OpenAPIV2.OperationObject> = this.yMap.get('paths') as Y.Map<OpenAPIV2.OperationObject>
    paths.forEach((value, key) => {
      const [pattern, method] = key.split(':')
      if (!data.paths?.[pattern]?.[method]) paths.delete(key)
    })
    Object.keys(data.paths || {}).forEach((pattern) => {
      const parameters = data.paths[pattern]?.parameters

      Object.keys(OpenAPIV2.HttpMethods).forEach((methodKey) => {
        const method = OpenAPIV2.HttpMethods[methodKey]
        if (!data.paths[pattern]?.[method]) return

        const operation = data.paths[pattern]?.[method]
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
}

class ComponentSetters implements Setters<ComponentsV2> {
  private readonly yMap: Y.Map<unknown>

  constructor(yMap: Y.Map<unknown>) {
    this.yMap = yMap
  }

  addComponent(component: { type: string; key: string; data: Record<string, any> }) {
    this.yMap.set(`${v2toV3typesMap[component.type]}:${component.key}`, component.data)
  }

  setFields(data: ComponentsV2): void {
    this.setParameters(data)
    this.setDefinitions(data)
    this.setSecurityDefinitions(data)
    this.setResponses(data)
  }

  setDefinitions(data: ComponentsV2): void {
    setObjectsToMap('schemas', this.yMap, data.definitions)
  }

  setParameters(data: ComponentsV2): void {
    setObjectsToMap('parameter', this.yMap, data.parameters)
  }

  setResponses(data: ComponentsV2): void {
    setObjectsToMap('responses', this.yMap, data.responses)
  }

  setSecurityDefinitions(data: ComponentsV2): void {
    //todo change conversion
    setObjectsToMap('securitySchemes', this.yMap, data.securityDefinitions)
  }
}
