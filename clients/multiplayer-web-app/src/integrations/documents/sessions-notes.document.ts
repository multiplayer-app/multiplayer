import { Callbacks, YjsDocument } from './yjs-document'

export class SessionsNotesDocument extends YjsDocument {
  private readonly _sessionId: string

  constructor (sessionId: string, callbacks?: Callbacks) {
    super(callbacks)
    this._key = sessionId
  }

  public get sessionId() {
    return this._sessionId
  }
}
