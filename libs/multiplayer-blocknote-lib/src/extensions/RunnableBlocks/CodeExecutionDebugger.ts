import { Notebook } from '@multiplayer/types'
import { IMultiplayerDebugger } from 'src/types'

export class CodeExecutionDebugger {
  private _spanId: string = ''
  private readonly instance: IMultiplayerDebugger | null
  private readonly runWithDebugger: boolean
  private readonly hasActiveSession: boolean
  private attrs: Notebook.GenerateSpanParams = { name: 'Unknown' }

  constructor(instance: IMultiplayerDebugger | null, runWithDebugger: boolean, attrs: Notebook.GenerateSpanParams) {
    this.instance = instance
    this.runWithDebugger = runWithDebugger
    this.hasActiveSession = !!instance?.getSession()
    this.attrs = attrs
  }

  get spanId() {
    return this._spanId
  }

  private get activeSession() {
    return this.instance?.getSession()
  }

  async init() {
    if (!this.instance || (!this.runWithDebugger && !this.instance.getSession())) {
      return Promise.resolve()
    }

    try {
      if (!this.instance.getSession()) {
        await this.instance.startSession()
      }
      this._spanId = this.instance.generateSpan(this.attrs)
    } catch (error) {
      console.error('Failed to initialize debugger:', error)
      return Promise.reject(error)
    }
  }

  async finish() {
    if (!this.instance || !this.runWithDebugger || (this.runWithDebugger && this.hasActiveSession)) {
      return Promise.resolve()
    }

    try {
      await this.instance!.stopSession()
    } catch (error) {
      console.error('Failed to stop debugger:', error)
      return Promise.reject(error)
    }
  }

  addSpanEvent(payload: { name: string; attributes: Record<string, string> }) {
    if (!this.isDebuggerActive()) return
    this.instance!.addSpanEvent(this._spanId, payload)
  }

  addSpanAttrs(attrs: Record<string, string>) {
    if (!this.isDebuggerActive()) return
    this.instance!.addSpanAttrs(this._spanId, attrs)
  }

  exportSpans() {
    if (!this.isDebuggerActive()) return
    this.instance!.exportSpans([this._spanId])
  }

  private isDebuggerActive() {
    return this.instance && this.activeSession
  }
}
