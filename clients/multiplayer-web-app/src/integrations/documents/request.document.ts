import { Callbacks, YjsDocument } from './yjs-document'
import { RequestEntityType } from '@multiplayer/types'

export class RequestDocument extends YjsDocument {
  private readonly _projectId: string
  private readonly _branchId: string
  private readonly _type: RequestEntityType

  constructor (projectId: string, branchId: string, type: RequestEntityType = RequestEntityType.MERGE_REQUEST, callbacks?: Callbacks) {
    super(callbacks)
    this._key = RequestDocument.generateKey(projectId, branchId, type)
    this._projectId = projectId
    this._branchId = branchId
    this._type = type
  }

  public get projectId() {
    return this._projectId
  }
  public get branchId() {
    return this._branchId
  }
  public get type() {
    return this._type
  }

  public static generateKey(projectId: string, branchId: string, type: RequestEntityType) {
    return `${projectId}.${branchId}.${type}`
  }
}
