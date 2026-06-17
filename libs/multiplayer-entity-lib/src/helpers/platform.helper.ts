import { v4 as uuidv4 } from 'uuid'
import * as Y from 'yjs'
import { PlatformSetters } from '../setters'


export const getComponentsInPlatform = (
  platform: Y.Doc,
  excludeTemporaryComponents: boolean = false,
): string[] => {
  const helper = new PlatformSetters(platform)
  return helper.getComponents(excludeTemporaryComponents)
}

export const getComponentUuid = (
  platform: Y.Doc,
  componentEntityId: string,
): string | undefined => {
  const setter = new PlatformSetters(platform)
  const component = setter.getComponentByLinkedTo(componentEntityId)
  return component?.id
}

export const isComponentAddedToPlatform = (
  platform: Y.Doc,
  platformComponentEntityId: string,
): boolean => {
  return !!getComponentUuid(platform, platformComponentEntityId)
}

export const addComponentToPlatform = (
  platform: Y.Doc,
  platformComponentEntityId: string,
  id?: string,
): Y.Doc => {
  const setter = new PlatformSetters(platform)

  const _id = id || uuidv4()

  setter.addComponent({
    id: _id,
    linkedTo: platformComponentEntityId,
  })
  return platform
}

export const isEdgeExistsInPlatform = (
  platformDoc: Y.Doc,
  sourcePlatformComponentEntityId: string,
  targetPlatformComponentEntityId: string,
): boolean => {
  const sourceComponentUuid = getComponentUuid(
    platformDoc,
    sourcePlatformComponentEntityId,
  )
  const targetComponentUuid = getComponentUuid(
    platformDoc,
    targetPlatformComponentEntityId,
  )

  if (
    !sourceComponentUuid
    || !targetComponentUuid
  ) {
    throw new Error('Missing component in platform')
  }
  const helper = new PlatformSetters(platformDoc)

  const foundEdge = helper.getEdgeByComponents(sourceComponentUuid, targetComponentUuid)
  return !!foundEdge
}

export const addEdgeToPlatform = (
  platform: Y.Doc,
  sourcePlatformComponentEntityId: string,
  targetPlatformComponentEntityId: string,
): Y.Doc => {
  const sourceComponentUuid = getComponentUuid(
    platform,
    sourcePlatformComponentEntityId,
  )
  const targetComponentUuid = getComponentUuid(
    platform,
    targetPlatformComponentEntityId,
  )
  if (
    !sourceComponentUuid
    || !targetComponentUuid
  ) {
    throw new Error('Missing component in platform')
  }

  const helper = new PlatformSetters(platform)

  const newEdgeId = `${sourceComponentUuid}_${targetComponentUuid}`
  helper.addEdge({
    id: newEdgeId,
    source: sourceComponentUuid,
    target: targetComponentUuid,
  })

  return platform
}


export const getEdgesInPlatform = (
  platform: Y.Doc,
  excludeTemporaryEdges: boolean = false,
): { sourceComponentId: string, targetComponentId: string }[] => {
  const helper = new PlatformSetters(platform)

  return helper.getEdges(excludeTemporaryEdges)
}

export const getEdgesInPlatformForComponent = (
  platform: Y.Doc,
  platformComponentEntityId: string,
): { sourceComponentId: string, targetComponentId: string }[] => {
  const helper = new PlatformSetters(platform)

  const componentUuid = getComponentUuid(
    platform,
    platformComponentEntityId,
  )

  if (!componentUuid) {
    throw new Error('Missing component in platform')
  }

  const edges = helper.getEdgesForComponent(componentUuid)

  return edges
}


export const getEdgesInPlatformFromComponent = (
  platform: Y.Doc,
  platformComponentEntityId: string,
): { sourceComponentId: string, targetComponentId: string }[] => {
  const helper = new PlatformSetters(platform)

  const componentUuid = getComponentUuid(
    platform,
    platformComponentEntityId,
  )

  if (!componentUuid) {
    throw new Error('Missing component in platform')
  }

  const edges = helper.getEdgesFromComponent(componentUuid)

  return edges
}

export const getEdgesInPlatformToComponent = (
  platform: Y.Doc,
  platformComponentEntityId: string,
): { sourceComponentId: string, targetComponentId: string }[] => {
  const helper = new PlatformSetters(platform)

  const componentUuid = getComponentUuid(
    platform,
    platformComponentEntityId,
  )

  if (!componentUuid) {
    throw new Error('Missing component in platform')
  }

  const edges = helper.getEdgesToComponent(componentUuid)

  return edges
}

export const removeEdgeFromPlatform = (
  platform: Y.Doc,
  sourcePlatformComponentEntityId: string,
  targetPlatformComponentEntityId: string,
): Y.Doc => {
  const sourceComponentUuid = getComponentUuid(
    platform,
    sourcePlatformComponentEntityId,
  )
  const targetComponentUuid = getComponentUuid(
    platform,
    targetPlatformComponentEntityId,
  )
  if (
    !sourceComponentUuid
    || !targetComponentUuid
  ) {
    throw new Error('Missing component in platform')
  }

  const helper = new PlatformSetters(platform)

  const edgeToRemove = helper.getEdgeByComponents(sourceComponentUuid, targetComponentUuid)

  if (edgeToRemove) {
    helper.removeEdge(edgeToRemove)
  }

  return platform
}
