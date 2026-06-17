import * as Y from 'yjs'
import { Component, DEFAULT_VIEW, Edge, EntityData, Group, Platform, UNKNOWN_X, UNKNOWN_Y } from '@multiplayer/types'
import { PlatformEdgeSetters } from './platform-edge.setters'
import { PlatformMetadataSetters } from './platform-metadata.setters'
import { PlatformViewSetters } from './platform-view.setters'
import { Setters } from '..'
import { PlatformRadarSetters } from './platform-radar.setters'

type NonVersionedPlatform = Omit<Platform, keyof EntityData>
export class PlatformSetters implements Setters<NonVersionedPlatform> {
  yMap: Y.Map<unknown>

  constructor(doc: Y.Doc) {
    this.yMap = doc.getMap('object')
  }

  setFields(data: NonVersionedPlatform) {
    this.setMetadata(data)
    this.setRadar(data)
    this.setEdges(data)
    this.setGroups(data)
    this.setComponents(data)
    this.setViews(data)
  }

  setMetadata(data: NonVersionedPlatform) {
    const metadata = this.yMap.has('metadata') ? this.yMap.get('metadata') as Y.Map<unknown>: new Y.Map<unknown>()
    const setter = new PlatformMetadataSetters(metadata)
    setter.setFields(data.metadata)
    this.yMap.set('metadata', metadata)
  }
  setRadar(data: NonVersionedPlatform) {
    const radar = this.yMap.has('radar') ? this.yMap.get('radar') as Y.Map<unknown>: new Y.Map<unknown>()
    const setter = new PlatformRadarSetters(radar)
    setter.setFields(data.radar || {})
    this.yMap.set('radar', radar)
  }

  setEdges(data: NonVersionedPlatform) {
    const edges: Y.Map<Y.Map<string>> = this.yMap.get('edges') as Y.Map<Y.Map<string>> || new Y.Map<Y.Map<string>>()
    Object.values(data.edges).forEach((edge: Edge) => {
      const map = new Y.Map<string>()
      const setter = new PlatformEdgeSetters(map)
      setter.setFields(edge)
      edges.set(edge.id, map)
    })
    this.yMap.set('edges', edges)
  }

  setComponents(data: NonVersionedPlatform) {
    const components = this.yMap.get('components') as Y.Map<Component> || new Y.Map<Component>()
    Object.values(data.components).forEach((component: Component) => {
      components.set(component.id, component)
    })
    this.yMap.set('components', components)
  }

  setGroups(data: NonVersionedPlatform) {
    const groups = this.yMap.get('groups') as Y.Map<Group> || new Y.Map<Group>()
    Object.values(data.groups || {}).forEach((group: Group) => {
      groups.set(group.id, group)
    })
    this.yMap.set('groups', groups)
  }

  getComponentByLinkedTo(linkedToId: string): Component | undefined {
    const components = this.yMap.get('components') as Y.Map<Component> || new Y.Map<Component>()
    return Array.from(components.values()).find((component) => component.linkedTo === linkedToId)
  }

  getComponentLinkedToById(id: string): string | undefined {
    const components = this.yMap.get('components') as Y.Map<Component> || new Y.Map<Component>()
    return components.get(id)?.linkedTo
  }

  getEdgeByComponents(sourceComponentId: string, targetComponentId: string): Y.Map<unknown> | undefined {
    const edges: Y.Map<any> = this.yMap.get('edges') as Y.Map<any> || new Y.Map<any>()
    return Array.from(edges.values()).find((edge) => {
      const helper = new PlatformEdgeSetters(edge)
      return helper.getTarget() === targetComponentId && helper.getSource() === sourceComponentId
    })
  }

  getEdgesForComponent(componentId: string): { sourceComponentId: string, targetComponentId: string }[] {
    const edges: Y.Map<any> = this.yMap.get('edges') as Y.Map<any> || new Y.Map<any>()

    return Array.from(edges.values())
      .filter((edge) => {
        const helper = new PlatformEdgeSetters(edge)

        return helper.getTarget() === componentId || helper.getSource() === componentId
      }).map((edge) => {
        const helper = new PlatformEdgeSetters(edge)

        const sourceComponentId = this.getComponentLinkedToById(helper.getSource() as string) as string
        const targetComponentId = this.getComponentLinkedToById(helper.getTarget() as string) as string

        return {
          sourceComponentId,
          targetComponentId,
        }
      })
  }

  getEdgesFromComponent(sourceComponentId: string): { sourceComponentId: string, targetComponentId: string }[] {
    const edges: Y.Map<any> = this.yMap.get('edges') as Y.Map<any> || new Y.Map<any>()

    return Array.from(edges.values())
      .filter((edge) => {
        const helper = new PlatformEdgeSetters(edge)

        return helper.getSource() === sourceComponentId
      }).map((edge) => {
        const helper = new PlatformEdgeSetters(edge)

        const sourceComponentId = this.getComponentLinkedToById(helper.getSource() as string) as string
        const targetComponentId = this.getComponentLinkedToById(helper.getTarget() as string) as string

        return {
          sourceComponentId,
          targetComponentId,
        }
      })
  }

  getEdgesToComponent(targetComponentId: string): { sourceComponentId: string, targetComponentId: string }[] {
    const edges: Y.Map<any> = this.yMap.get('edges') as Y.Map<any> || new Y.Map<any>()

    return Array.from(edges.values())
      .filter((edge) => {
        const helper = new PlatformEdgeSetters(edge)

        return helper.getTarget() === targetComponentId
      }).map((edge) => {
        const helper = new PlatformEdgeSetters(edge)

        const sourceComponentId = this.getComponentLinkedToById(helper.getSource() as string) as string
        const targetComponentId = this.getComponentLinkedToById(helper.getTarget() as string) as string

        return {
          sourceComponentId,
          targetComponentId,
        }
      })
  }

  getComponents(excludeTemporaryComponents: boolean = false): string[] {
    const components = this.yMap.get('components') as Y.Map<Component> || new Y.Map<Component>()
    const componentsIds = new Set<string>()

    components.forEach((component) => {
      if (excludeTemporaryComponents && component.detectionId) {
        return
      }
      componentsIds.add(component.linkedTo as string)
    })

    return Array.from(componentsIds)
  }

  getEdges(excludeTemporaryEdges: boolean = false): { sourceComponentId: string, targetComponentId: string }[] {
    const edges: Y.Map<unknown> = this.yMap.get('edges') as Y.Map<unknown> || new Y.Map<unknown>()

    return Array.from(edges.values()).reduce((acc, edge) => {
      const helper = new PlatformEdgeSetters(edge)

      if (excludeTemporaryEdges && helper.getDetectionId()) {
        return acc
      }

      const sourceComponentId = this.getComponentLinkedToById(helper.getSource() as string) as string
      const targetComponentId = this.getComponentLinkedToById(helper.getTarget() as string) as string

      acc.push({
        sourceComponentId,
        targetComponentId,
      })

      return acc
    }, [])
  }

  addComponent(component: Component) {
    const components = this.yMap.get('components') as Y.Map<Component> || new Y.Map<Component>()
    components.set(component.id, component)
    const defaultView = this.getViews().get(DEFAULT_VIEW) as Y.Map<unknown>
    const setter = new PlatformViewSetters(defaultView)
    setter.addPosition(component.id, { x: UNKNOWN_X, y: UNKNOWN_Y })
  }

  addEdge(edge: Edge) {
    const edges: Y.Map<unknown> = this.yMap.get('edges') as Y.Map<unknown> || new Y.Map<unknown>()
    const map = new Y.Map<string>()
    const setter = new PlatformEdgeSetters(map)
    setter.setFields(edge)
    edges.set(edge.id, map)
  }

  removeEdge(edge: Y.Map<unknown>) {
    const edges: Y.Map<Y.Map<unknown>> = this.yMap.get('edges') as Y.Map<Y.Map<unknown>> || new Y.Map<Y.Map<unknown>>()

    edges.delete((edge as any).get('id'))
  }

  getViews() {
    return this.yMap.get('views') as Y.Map<unknown> || new Y.Map<unknown>()
  }

  setViews(data: NonVersionedPlatform) {
    const views: Y.Map<unknown> = this.getViews()
    Object.keys(data.views).forEach((viewId: string) => {
      const map = new Y.Map<unknown>()
      const setter = new PlatformViewSetters(map)
      setter.setFields(data.views[viewId])
      views.set(viewId, map)
    })
    this.yMap.set('views', views)
  }
}
