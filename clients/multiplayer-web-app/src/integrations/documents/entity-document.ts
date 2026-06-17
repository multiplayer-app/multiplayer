import debounce from 'lodash.debounce'
import { Y } from '@multiplayer/entity'
import { IEntity } from '@multiplayer/types'
import { Callbacks, YjsDocument } from './yjs-document'
import { updateEntity } from '../../shared/services/version.service'

export class EntityDocument extends YjsDocument {
  private readonly _projectId: string
  private readonly _entityId: string
  private readonly _branchId: string

  protected debouncedMetadataUpdate: () => Promise<void>
  private nameMap: Y.Map<string>
  protected summaryTimestamps: Record<string, number> = {}

  constructor(params: {
    branchId: string,
    entityId: string,
    projectId: string,
    callbacks?: Callbacks
  }) {
    super(params.callbacks)
    this._key = EntityDocument.generateKey(params.projectId, params.branchId, params.entityId)
    this._projectId = params.projectId
    this._entityId = params.entityId
    this._branchId = params.branchId
    this.debouncedMetadataUpdate = debounce(this.onMetadataUpdate.bind(this), 1000, { 'maxWait': 10000 })

    this.nameMap = this.getMap('name')
  }
  private async onMetadataUpdate() {
    try {
      // dirty hack to reduce racing with entity-update notification, any better solution is extremely appreciated
      await updateEntity(this.branchId, this.entityId,
        {
          key: this.getName().trim(),
          metadata: this.getSummary(),
        }
      )
    } catch (err) {
      this.callbacks?.onError(err)
    }
  }

  public get entityId() {
    return this._entityId
  }
  public get projectId() {
    return this._projectId
  }
  public get branchId() {
    return this._branchId
  }

  async init(entity: IEntity, timestamp: number) {
    try {
      this.setName(entity.key, timestamp)
      this.setSummary(entity.metadata, timestamp)
      this.observeNameChanges()
    } catch (err) {
      console.error(err)
      this.callbacks?.onError('Cannot initialize document')
      throw err
    }
    await super.init()
  }

  private observeNameChanges() {
    this.nameMap.observe(async (event, transaction) => {
      this.summaryTimestamps.name = Date.now()
      if (!transaction.local) return
      await this.debouncedMetadataUpdate()
    })
  }

  protected getName() {
    return this.nameMap.get('name')
  }

  public static generateKey(projectId: string, branchId: string, entityId: string) {
    return `${projectId}.${branchId}.${entityId}`
  }

  protected getSummary() {
    // should be implemented in children
    return {}
  }

  public setSummary(metadata: Record<string, string>, timestamp: number) {
    // should be implemented in children
  }

  public setName(newName: string, timestamp: number) {
    if (this.getName() === newName) return

    if (this.summaryTimestamps.name >= timestamp) {
      // user has newer changes
      return
    }
    this.summaryTimestamps.name = timestamp
    this.nameMap.set('name', newName)
  }
}
