import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'

export interface Callbacks {
  onError: (err: any) => void
}

export abstract class YjsDocument extends Y.Doc {
  protected _key: string = 'doc'
  protected readonly callbacks?: Callbacks
  protected changed = false

  constructor (callbacks?: Callbacks) {
    super({ gc: true })
    this.callbacks = callbacks
  }

  public isChanged() {
    return this.changed
  }

  async init(...params: any): Promise<void> {}

  public get key() {
    return this._key
  }
}
