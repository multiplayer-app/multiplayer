import { EntityCommitChangeType } from '@multiplayer/types'
import {
  deepAssign,
} from '../util'

export const getChangeType = (change) => {
  if (!change) {
    return null
  }

  if (Array.isArray(change)) {
    if (change.length === 1) {
      // Array with single element: added
      return EntityCommitChangeType.CREATE
    } else if (change.length === 2) {
      // Array with two elements: modified
      return EntityCommitChangeType.UPDATE
    } else if (change.length === 3 && change[2] === 0) {
      // Array with three elements and last element is 0: removed
      return EntityCommitChangeType.DELETE
    } else if (change.length === 3 && change[2] === 2) {
      // Array with three elements and last element is 2: text diff
      return EntityCommitChangeType.UPDATE
    } else if (change.length === 3 && change[2] === 3) {
      // Array with three elements and last element is 3: array move
      return EntityCommitChangeType.UPDATE
    }
  } else if (typeof change === 'object') {
    return EntityCommitChangeType.UPDATE
  }

  return null
}

export const getChangeTypesByDiff = (diff) => {
  const changes = new Map()
  for (const key in diff) {
    if (Object.prototype.hasOwnProperty.call(diff, key)) {
      const change = diff[key]
      if (Array.isArray(change)) {
        if (change.length === 1) {
          // Array with single element: added
          changes.set(key, EntityCommitChangeType.CREATE)
        } else if (change.length === 2) {
          // Array with two elements: modified
          changes.set(key, EntityCommitChangeType.UPDATE)
        } else if (change.length === 3 && change[2] === 0) {
          // Array with three elements and last element is 0: removed
          changes.set(key, EntityCommitChangeType.DELETE)
        } else if (change.length === 3 && change[2] === 2) {
          // Array with three elements and last element is 2: text diff
          changes.set(key, EntityCommitChangeType.UPDATE)
        } else if (change.length === 3 && change[2] === 3) {
          // Array with three elements and last element is 3: array move
          changes.set(key, EntityCommitChangeType.UPDATE)
        }
      } else if (typeof change === 'object') {
        const nestedChanges = getChangeTypesByDiff(change)
        changes.set(key, EntityCommitChangeType.UPDATE)
        nestedChanges.forEach((nestedChangeType, nestedChangeKey) => {
          changes.set(`${key}.${nestedChangeKey}`, nestedChangeType)
        })
      }
    }
  }

  return changes
}

export const applyChanges = (openApiDoc, openApiChangesDoc) => {
  // const mergedData = deepAssign(openApiDoc, changesDoc);
}
