import * as Y from "yjs";
import { ProviderConfig, SessionNoteStateParams } from 'shared/models/interfaces';
import { BaseYjsProvider, EmittedEvents } from './BaseYjsProvider';
import { SessionsNotesDocument } from './documents/sessions-notes.document';
import {
  createSessionNote,
  downloadSessionNoteUpdate,
  getSessionNote,
  uploadSessionNoteUpdate,
} from '../shared/services/radar.service';
import axios from 'axios';

export class SessionNotesSocketIOProvider extends BaseYjsProvider {
  public workspaceId: string;
  public projectId: string;
  public sessionId: string;

  constructor(
    url: string,
    apiPath: string,
    params: SessionNoteStateParams,
    { auth = {}, query = {} }: ProviderConfig
  ) {
    super(url, apiPath, params.sessionId, { auth, query }, params);

    this.workspaceId = params.workspaceId;
    this.projectId = params.projectId;
    this.sessionId = params.sessionId;
  }

  protected setupDocument(params: SessionNoteStateParams) {
    const callbacks = {
      onError: (err: any) => this.emit(EmittedEvents.error, [err]),
    };
    return new SessionsNotesDocument(
      params.sessionId,
      callbacks
    );
  }

  private async getStepState(params: {
    sessionId: string,
    workspaceId: string,
    projectId: string,
  }): Promise<Uint8Array> {
    let note;
    try {
      note = await getSessionNote(params);
    } catch (err) {
      note = await createSessionNote(params);
    }
    const stateResp = await axios.get(note.stateUrl, {
      responseType: "arraybuffer",
    });
    return new Uint8Array(stateResp.data);
  }

  protected async initDocument() {
    try {
      const state = await this.getStepState({
        sessionId: this.sessionId,
        workspaceId: this.workspaceId,
        projectId: this.projectId,
      });
      if (!this._doc) {
        return;
      }
      Y.applyUpdate(this._doc, state, this);
      this.initialized = true;
    } catch (err) {
      console.warn("Cannot init the state", err);
      this.onSocketConnectionError(err);
      this.disconnect();
    }
  }

  protected downloadUpdate(id: string): Promise<Uint8Array> {
    return downloadSessionNoteUpdate({
      workspaceId: this.workspaceId,
      sessionId: this.sessionId,
      projectId: this.projectId,
      updateId: id,
    })
  }
  protected async uploadUpdate(updateId: string, update: Uint8Array): Promise<void> {
    return uploadSessionNoteUpdate({
      workspaceId: this.workspaceId,
      sessionId: this.sessionId,
      projectId: this.projectId,
      updateId: updateId,
    }, update)
  }
}
