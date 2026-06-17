import { Setters } from '../setters'
import { OpenAPIV3 } from 'openapi-types'
import * as Y from 'yjs'
import { PartialOpenapiV3x } from './openapiv3x.setters'

export class Openapiv3xYMapSetters implements Setters<PartialOpenapiV3x> {
  private yMap: Y.Map<unknown>

  constructor(doc: Y.Doc) {
    this.yMap = doc.getMap('object')
  }

  setFields(data: PartialOpenapiV3x): void {
    this.setPaths(data)
    this.setTags(data)
    this.setComponents(data)
  }

  setPaths(data: PartialOpenapiV3x): void {
    const pathsMap= this.yMap.get('paths') as Y.Map<OpenAPIV3.OperationObject>
    if (!pathsMap) {
      data.paths = {}
      return
    }

    data.paths = Array.from(pathsMap.keys()).reduce((acc, key)=> {
      const parts = key.split(':')
      const method = parts.pop()
      const path = parts.join(':')

      if (!path || !method) return acc
      if (!acc[path]) acc[path] = {} as OpenAPIV3.PathsObject
      (acc[path] as OpenAPIV3.PathItemObject)[method] = pathsMap.get(key)
      return acc
    }, data.paths || {})
  }

  setTags(data: PartialOpenapiV3x): void {
    const tagsMap= this.yMap.get('tags') as Y.Map<OpenAPIV3.TagObject>
    if (!tagsMap) {
      data.tags = []
      return
    }
    data.tags = Array.from(tagsMap.values())
  }

  setComponents(data: PartialOpenapiV3x) {
    const components = this.yMap.get('components') as Y.Map<unknown>
    let partialToReplace: OpenAPIV3.ComponentsObject = {}
    if (components) {
      partialToReplace = Array.from(components.keys()).reduce((acc, key) => {
        const [type, name] = key.split(':', 2)
        if (!type || !name) return acc
        if (!acc[type]) acc[type] = {}
        acc[type][name] = components.get(key)
        return acc
      }, data.components || {})
    }

    data.components = partialToReplace
  }
}
