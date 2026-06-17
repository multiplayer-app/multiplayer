import { Setters } from '../setters'
import { OpenAPIV2 } from 'openapi-types'
import * as Y from 'yjs'
import { ComponentsV2, PartialOpenapiV2 } from './openapiv2.setters'

export const v2typesMap = {
  schemas: 'definitions',
  parameters: 'parameters',
  responses: 'responses',
  securitySchemes: 'securityDefinitions',
}
export const v2toV3typesMap = {
  definitions: 'schemas',
  parameters: 'parameters',
  responses: 'responses',
  securityDefinitions: 'securitySchemes',
}

// class is used when you need to fulfill data object with the records from Y.Map

export class Openapiv2YMapSetters implements Setters<PartialOpenapiV2> {
  private yMap: Y.Map<unknown>

  constructor(doc: Y.Doc) {
    this.yMap = doc.getMap('object')
  }

  setFields(data: PartialOpenapiV2): void {
    this.setPaths(data)
    this.setTags(data)
    this.setComponents(data)
  }

  setPaths(data: PartialOpenapiV2): void {
    const pathsMap= this.yMap.get('paths') as Y.Map<OpenAPIV2.OperationObject>
    if (!pathsMap) {
      data.paths = {}
      return
    }

    data.paths = Array.from(pathsMap.keys()).reduce((acc, key)=> {
      const parts = key.split(':')
      const method = parts.pop()
      const path = parts.join(':')

      if (!path || !method) return acc
      if (!acc[path]) acc[path] = {}
      acc[path][method] = pathsMap.get(key)
      return acc
    }, data.paths || {})
  }

  setTags(data: PartialOpenapiV2): void {
    const tagsMap= this.yMap.get('tags') as Y.Map<OpenAPIV2.TagObject>
    if (!tagsMap) {
      data.tags = []
      return
    }
    data.tags = Array.from(tagsMap.values())
  }

  setComponents(data: PartialOpenapiV2) {
    const components = this.yMap.get('components') as Y.Map<unknown>
    let partialToReplace: ComponentsV2 = {}
    if (components) {
      partialToReplace = Array.from(components.keys()).reduce((acc, key) => {
        const [type, name] = key.split(':', 2)
        if (!type || !name || !v2typesMap[type]) return acc
        const v2Type = v2typesMap[type]

        if (!acc[v2Type]) acc[v2Type] = {}
        acc[v2Type][name] = components.get(key)
        return acc
      }, {} as ComponentsV2)
    }

    Object.values(v2typesMap).forEach((key: string) => {
      if (!data[key] || !partialToReplace[key]) return
      data[key] = Object.assign(data[key] || {}, partialToReplace[key] || {})
    })
  }
}
