import * as Y from 'yjs'
import { ISessionNoteItem, SessionNoteType } from '@multiplayer/types'

export class SessionNotesHelper {
  /**
   * Add a new session note block to YXML fragment
   */
  static addSessionNoteBlock(
    fragment: Y.XmlFragment,
    noteData: ISessionNoteItem,
  ): void {
    const noteElement = new Y.XmlElement('session-note-block')

    // Set attributes
    noteElement.setAttribute('id', noteData.id)
    noteElement.setAttribute('type', noteData.type)
    if (noteData.note !== undefined) noteElement.setAttribute('note', noteData.note.trim())
    if (noteData.title !== undefined) noteElement.setAttribute('title', noteData.title.trim())
    if (noteData.timestamp !== undefined) noteElement.setAttribute('timestamp', noteData.timestamp.toString())
    if (noteData.metadata !== undefined) noteElement.setAttribute('metadata', JSON.stringify(noteData.metadata))

    // Check if the last element is an empty paragraph and insert before it
    if (fragment.length > 0) {
      const lastChild = fragment.get(fragment.length - 1)
      if (lastChild instanceof Y.XmlElement &&
        lastChild.nodeName === 'paragraph' &&
        (!lastChild.firstChild || (lastChild.firstChild instanceof Y.XmlText && lastChild.firstChild.toString().trim() === ''))) {
        // Insert before the empty paragraph
        const lastIndex = fragment.length - 1
        fragment.insert(lastIndex, [noteElement])
      } else {
        // Add to fragment normally
        fragment.push([noteElement])
      }
    } else {
      // Add to fragment normally if it's empty
      fragment.push([noteElement])
    }
  }

  /**
   * Update an existing session note block in YXML fragment
   */
  static updateSessionNoteBlock(
    fragment: Y.XmlFragment,
    noteId: string,
    updates: Partial<ISessionNoteItem>,
  ): boolean {
    let element: Y.XmlElement | Y.XmlText | null = fragment.firstChild

    while (element !== null) {
      if (element instanceof Y.XmlElement &&
        element.nodeName === 'session-note-block' &&
        element.getAttribute('id') === noteId) {

        // Update attributes
        if (updates.note !== undefined) element.setAttribute('note', updates.note)
        if (updates.title !== undefined) element.setAttribute('title', updates.title)
        if (updates.timestamp !== undefined) element.setAttribute('timestamp', updates.timestamp.toString())
        if (updates.metadata !== undefined) element.setAttribute('metadata', JSON.stringify(updates.metadata))

        return true
      }
      element = element.nextSibling
    }

    return false
  }

  /**
   * Delete a session note block from YXML fragment
   */
  static deleteSessionNoteBlock(
    fragment: Y.XmlFragment,
    noteId: string,
  ): boolean {
    let element: Y.XmlElement | Y.XmlText | null = fragment.firstChild
    let index = 0

    while (element !== null) {
      if (element instanceof Y.XmlElement &&
        element.nodeName === 'session-note-block' &&
        element.getAttribute('id') === noteId) {

        fragment.delete(index, 1)
        return true
      }
      element = element.nextSibling
      index++
    }

    return false
  }

  /**
   * Find a session note block by ID
   */
  static findSessionNoteBlock(
    fragment: Y.XmlFragment,
    noteId: string,
  ): Y.XmlElement | null {
    let element: Y.XmlElement | Y.XmlText | null = fragment.firstChild

    while (element !== null) {
      if (element instanceof Y.XmlElement &&
        element.nodeName === 'session-note-block' &&
        element.getAttribute('id') === noteId) {
        return element
      }
      element = element.nextSibling
    }

    return null
  }

  /**
   * Get all session note blocks from YXML fragment
   */
  static getAllSessionNoteBlocks(fragment: Y.XmlFragment): Array<ISessionNoteItem> {
    const notes: Array<ISessionNoteItem> = []

    let element: Y.XmlElement | Y.XmlText | null = fragment.firstChild

    while (element !== null) {
      if (element instanceof Y.XmlElement && element.nodeName === 'session-note-block') {
        const id = element.getAttribute('id')
        const note = element.getAttribute('note')
        const type = element.getAttribute('type')
        const title = element.getAttribute('title')
        const timestamp = element.getAttribute('timestamp')
        const metadataStr = element.getAttribute('metadata')

        let metadata: Record<string, any> | undefined
        if (metadataStr) {
          try {
            metadata = JSON.parse(metadataStr)
          } catch (e) {
            // eslint-disable-next-line
            console.warn('Failed to parse metadata for note:', id)
          }
        }

        if (id && type) {
          notes.push({
            id,
            note,
            title,
            metadata,
            type: type as SessionNoteType,
            timestamp: timestamp ? parseInt(timestamp) : undefined,
          })
        }
      }
      element = element.nextSibling
    }

    return notes
  }

  /**
   * Insert a session note block at a specific position
   */
  static insertSessionNoteBlockAt(
    fragment: Y.XmlFragment,
    index: number,
    noteData: ISessionNoteItem,
  ): void {
    const noteElement = new Y.XmlElement('session-note-block')

    // Set attributes
    noteElement.setAttribute('id', noteData.id)
    noteElement.setAttribute('type', noteData.type)
    if (noteData.note !== undefined) noteElement.setAttribute('note', noteData.note.trim())
    if (noteData.title !== undefined) noteElement.setAttribute('title', noteData.title.trim())
    if (noteData.timestamp !== undefined) noteElement.setAttribute('timestamp', noteData.timestamp.toString())
    if (noteData.metadata !== undefined) noteElement.setAttribute('metadata', JSON.stringify(noteData.metadata))

    // Insert at specific position
    fragment.insert(index, [noteElement])
  }

  /**
   * Move a session note block to a different position
   */
  static moveSessionNoteBlock(
    fragment: Y.XmlFragment,
    noteId: string,
    newIndex: number,
  ): boolean {
    const note = this.findSessionNoteBlock(fragment, noteId)
    if (!note) return false

    // Find current index
    let currentIndex = 0
    let element: Y.XmlElement | Y.XmlText | null = fragment.firstChild

    while (element !== null) {
      if (element === note) break
      if (element instanceof Y.XmlElement && element.nodeName === 'session-note-block') {
        currentIndex++
      }
      element = element.nextSibling
    }

    // Delete from current position and insert at new position
    fragment.delete(currentIndex, 1)
    fragment.insert(newIndex, [note])

    return true
  }

  /**
   * Clear all session note blocks
   */
  static clearAllSessionNoteBlocks(fragment: Y.XmlFragment): void {
    let element: Y.XmlElement | Y.XmlText | null = fragment.firstChild
    let index = 0

    while (element !== null) {
      if (element instanceof Y.XmlElement && element.nodeName === 'session-note-block') {
        fragment.delete(index, 1)
        // Don't increment index since we deleted an element
      } else {
        index++
      }
      element = fragment.get(index) as Y.XmlElement | Y.XmlText
    }
  }
}
