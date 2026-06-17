import { EntityDocument } from './entity-document'
import { ApiType, ApiView, IEntity } from '@multiplayer/types'
import { Callbacks } from './yjs-document'
import { ApiHelper, Y } from '@multiplayer/entity'
import debounce from 'lodash.debounce'
import Delta from 'quill-delta'


export class ApiDocument extends EntityDocument {
  protected text: Y.Text
  protected object: Y.Map<Y.Map<unknown>>
  protected metadata: Y.Map<string>
  protected views: Y.Map<ApiView>
  private readonly UNKNOWN_VERSION = 'unknown'
  private readonly INTERNAL_TRANSACTION = 'internal'

  private validConvertibleObject: Record<string, unknown> = {}

  constructor (params: { projectId: string, branchId: string, entityId: string, callbacks?: Callbacks }) {
    super(params)
    this.text = this.getText('text')
    this.object = this.getMap('object')
    this.metadata = this.getMap('metadata')
    this.views = this.getMap('views')
  }

  async init(entity: IEntity, timestamp: number) {
    await super.init(entity, timestamp)

    this.text = this.getText('text')
    this.object = this.getMap('object')
    this.metadata = this.getMap('metadata')
    this.views = this.getMap('views')
    if (this.metadata.get('provider') === ApiType.OPENAPI) {
      if (!this.object.has('paths')) this.object.set('paths', new Y.Map<unknown>())
      if (!this.object.has('tags')) this.object.set('tags', new Y.Map<unknown>())
      if (!this.object.has('components')) this.object.set('components', new Y.Map<unknown>())
    }
    this.onTextUpdate()

    const debouncedTextUpdate = debounce(this.onTextUpdate.bind(this), 500, { 'maxWait': 2000 })
    const debouncedObjectUpdate = debounce(this.onObjectUpdate.bind(this), 500, { 'maxWait': 2000 })
    this.metadata.observe((event, transaction) => {
      if (!transaction.local) return
      if (!event.keys.has('extension')) return
      debouncedTextUpdate()
    })

    this.object.observeDeep((events, transaction) => {
      if (transaction.local && transaction.origin !== this.INTERNAL_TRANSACTION) {
        debouncedObjectUpdate()
      }
    })

    this.text.observe((event, transaction) => {
      if (transaction.local && transaction.origin !== this.INTERNAL_TRANSACTION) {
        debouncedTextUpdate()
      }
    })
  }

  protected onObjectUpdate(): void {
    const provider = this.metadata.get('provider')
    if (!ApiHelper.isConvertibleApi(provider)) return

    if (provider === ApiType.OPENAPI) {
      this.transact(() => {
        this.updateOpenapiText()
      }, this.INTERNAL_TRANSACTION)
    }
  }

  private updateOpenapiText() {
    const version = this.metadata.get('version')
    const extension = this.metadata.get('extension') || 'txt'

    const setterConstructor = ApiHelper.getOpenapiYMapSetters(version)
    if (!setterConstructor) return
    const setter = new setterConstructor(this)
    setter.setFields(this.validConvertibleObject as any)
    const updatedText = ApiHelper.getTextFromJson(this.validConvertibleObject, extension)
    const current = new Delta(this.text.toDelta())
    const newDeltas = current.diff(new Delta().insert(updatedText))
    this.text.applyDelta(newDeltas.ops)
  }

  protected onTextUpdate(): void {
    this.transact(() => {
      const text = this.text.toJSON()
      const extension = this.metadata.get('extension') || 'txt'
      const version = this.metadata.get('version') || this.UNKNOWN_VERSION
      const provider = this.metadata.get('provider') || ApiType.OTHER
      const value = ApiHelper.getParsedJson(text, extension)
      this.refreshMetadata(text, value)
      if (!ApiHelper.isConvertibleApi(provider) ||
          !value ||
          !ApiHelper.isValidApi(ApiType[provider], version, value)) {
        return
      }
      this.validConvertibleObject = value
      this.convertToYMap(value)
      this.refreshViews()
    }, this.INTERNAL_TRANSACTION)
  }

  private refreshViews() {
    const paths = this.object.get('paths') as Y.Map<unknown>
    const tags = this.object.get('tags') as Y.Map<unknown>
    const components = this.object.get('components') as Y.Map<unknown>

    this.views.forEach((view, key) => {
      Object.keys(view.tags || {}).forEach((key) => {
        if (!tags.has(key)) delete view.tags?.[key]
      })
      Object.keys(view.components || {}).forEach((key) => {
        if (!components.has(key)) delete view.components?.[key]
      })
      Object.keys(view.paths || {}).forEach((key) => {
        if (!paths.has(key)) delete view.paths?.[key]
      })
      this.views.set(key, view)
    })
  }


  private refreshMetadata(text: string, parsedObject?: Record<string, unknown>) {
    const extension = this.metadata.get('extension') || 'txt'
    const metadata = ApiHelper.fetchMetadata(extension, text, parsedObject)
    this.metadata.set('provider', metadata.provider)
    this.metadata.set('version', metadata.version)
  }


  protected convertToYMap(data: Record<string, unknown>): void {
    if (!data) return

    const provider = this.metadata.get('provider')
    const version = this.metadata.get('version')
    if (provider === ApiType.OPENAPI) {
      const setterConstructor = ApiHelper.getOpenapiSetters(version)
      if (setterConstructor) {
        const setters = new setterConstructor(this)
        setters.setFields(data as any)
      }
    }
    //todo: add async api
  }
}
