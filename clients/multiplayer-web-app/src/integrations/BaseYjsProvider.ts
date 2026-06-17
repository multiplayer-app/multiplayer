import * as Y from "yjs";
import * as bc from "lib0/broadcastchannel";
import * as AwarenessProtocol from "y-protocols/awareness";

import { Observable } from "lib0/observable";
import { io, Socket } from "socket.io-client";
import { YjsEvents } from "@multiplayer/types";
import { ConnectionStatus } from "shared/models/enums";
import { AwarenessDiff, ProviderConfig } from "shared/models/interfaces";
import { getAuthHeaders } from "shared/api";

function prepareUrl(url: string) {
  if (url[url.length - 1] === "/") return url.slice(0, url.length - 1);
  return url;
}

enum BcEvents {
  syncStep1 = "sync-step-1",
  syncStep2 = "sync-step-2",
  syncUpdate = "sync-update",
  queryAwareness = "query-awareness",
  awarenessUpdate = "awareness-update",
}

export enum EmittedEvents {
  sync = "sync",
  synced = "synced",
  status = "status",
  error = "error",
  connectionClose = "connection-close",
  connectionError = "connection-error",
  docDestroy = "doc-destroy",
  awarenessChange = "awareness-change",
  staticEdit = "static-edit",
}

export abstract class BaseYjsProvider extends Observable<string> {
  protected readonly _url: string;
  protected readonly _broadcastChannel: string;
  protected _synced: boolean = false;
  protected _initialized: boolean = false;
  protected _status: ConnectionStatus = ConnectionStatus.disconnected;
  protected _doc: Y.Doc;

  public socket: Socket;
  public disableBc: boolean;
  public bcconnected: boolean = false;
  public awareness: AwarenessProtocol.Awareness;
  protected resyncInterval: NodeJS.Timeout | null = null;

  protected isStatic = false;
  protected notifiedAboutStatic = false;
  protected missedUpdates: Uint8Array[] = [];

  protected static defaultResyncInterval = 30000;

  constructor(
    url: string,
    apiPath: string,
    namespace: string,
    { auth = {}, query = {} }: ProviderConfig,
    params: any
  ) {
    super();

    this._url = prepareUrl(url);
    this.disableBc = true;

    this._doc = this.setupDocument(params);
    this.awareness = new AwarenessProtocol.Awareness(this._doc);

    this.socket = io(`${url}|${namespace}`, {
      query,
      path: apiPath,
      forceNew: true,
      autoConnect: false,
      withCredentials: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      reconnectionDelayMax: 20000,
      transports: ["websocket", "polling"],
      auth: {
        ...auth,
        ...getAuthHeaders()
      },
    });

    this._broadcastChannel = `${this._url}/${namespace}`;

    this.socket.on("connect", this.onSocketConnection);
    this.socket.on("disconnect", this.onSocketDisconnection);
    this.socket.on("connect_error", this.onSocketConnectionError);

    this.initSyncListeners();
    this.initAwarenessListeners();
    this.initSystemListeners();
    this.connect();
  }

  protected abstract setupDocument(params: any): Y.Doc;
  protected abstract initDocument(): Promise<void>;
  protected abstract downloadUpdate(id: string): Promise<Uint8Array>;
  protected abstract uploadUpdate(id: string, update: Uint8Array): Promise<void>;

  public get broadcastChannel(): string {
    return this._broadcastChannel;
  }

  public get doc(): Y.Doc | null {
    if (!this._synced || !this._initialized) return null;
    return this._doc;
  }

  public get url(): string {
    return this._url;
  }

  public get initialized(): boolean {
    return this._initialized;
  }

  public set initialized(state) {
    if (this._initialized === state) return;

    this._initialized = state;
    this.emit(EmittedEvents.synced, [this._synced && this._initialized]);
    this.emit(EmittedEvents.sync, [this._synced && this._initialized]);
  }

  public get synced(): boolean {
    return this._synced;
  }

  public set synced(state) {
    if (this._synced === state) return;

    this._synced = state;

    this.emit(EmittedEvents.synced, [this._synced && this._initialized]);
    this.emit(EmittedEvents.sync, [this._synced && this._initialized]);
  }

  public get status(): ConnectionStatus {
    return this._status;
  }

  public set status(state: ConnectionStatus) {
    if (this._status === state) return;
    this._status = state;
    this.emit(EmittedEvents.status, [{ status: this._status }]);
  }

  protected initSyncListeners(): void {
    this._doc.on("update", this.onUpdateDoc);
    this.socket.on(YjsEvents.SYNC_INIT, this.onSocketSyncInit);
    this.socket.on(YjsEvents.SYNC_INIT_2, this.onSocketSyncInitStep2);
    this.socket.on(YjsEvents.SYNC_STEP_1, this.onSocketSyncStep);
    this.socket.on(YjsEvents.SYNC_STEP_2, this.onSocketSyncStep2);
    this.socket.on(YjsEvents.SYNC_UPDATE, this.onSocketSyncUpdate);
    this.socket.on(YjsEvents.DESTROY_DOC, this.onDocDestroy);
    this.socket.on(YjsEvents.ERROR, this.onError);
    this.socket.on(YjsEvents.SYNC_UPDATE_URL_DONE, this.onSocketSyncUpdateUrlDone);
  }

  protected destroySyncListeners(): void {

    this._doc?.off("update", this.onUpdateDoc);
    this.socket.off(YjsEvents.SYNC_INIT, this.onSocketSyncInit);
    this.socket.off(YjsEvents.SYNC_INIT_2, this.onSocketSyncInitStep2);
    this.socket.off(YjsEvents.SYNC_STEP_1, this.onSocketSyncStep);
    this.socket.off(YjsEvents.SYNC_STEP_2, this.onSocketSyncStep2);
    this.socket.off(YjsEvents.SYNC_UPDATE, this.onSocketSyncUpdate);
    this.socket.off(YjsEvents.DESTROY_DOC, this.onDocDestroy);
    this.socket.off(YjsEvents.ERROR, this.onError);
    this.socket.off(YjsEvents.SYNC_UPDATE_URL_DONE, this.onSocketSyncUpdateUrlDone);
  }

  protected onDocDestroy = () => {
    this.emit(EmittedEvents.docDestroy, []);
  };

  protected onError = (error: any) => {
    this.emit(EmittedEvents.error, [error]);
  };

  protected initAwarenessListeners(): void {
    this.awareness.on("update", this.onAwarenessUpdate);
    this.awareness.on("change", this.onAwarenessUpdate);

    this.socket.on(YjsEvents.AWARENESS_UPDATE, this.onSocketAwarenessUpdate);
  }

  protected destroyAwarenessListeners(): void {
    this.awareness.off("update", this.onAwarenessUpdate);
    this.awareness.off("change", this.onAwarenessUpdate);

    this.socket.off(YjsEvents.AWARENESS_UPDATE, this.onSocketAwarenessUpdate);
  }

  protected initSystemListeners(): void {
    if (typeof window !== "undefined")
      window.addEventListener("beforeunload", this.beforeUnloadHandler);
    else if (typeof process !== "undefined")
      process.on("exit", this.beforeUnloadHandler);
  }

  public connect(): void {
    if (this.socket.connected) return;
    this.status = ConnectionStatus.connecting;
    this.socket.connect();
    if (!this.disableBc) this.connectBc();
    this.synced = false;
  }

  protected emitUpdate(update: Uint8Array) {
    if (update.byteLength > 5e5) {
      this.socket
        .timeout(5000)
        .emit(YjsEvents.SYNC_UPDATE_URL, async (err, id: string) => {
          if (err) {
            this.missedUpdates.push(update);
            return;
          }
          try {
            await this.uploadUpdate(id, update);
            this.socket.emit(YjsEvents.SYNC_UPDATE_URL_DONE, id);
          } catch (e) {
            console.error(e.toString());
          }
        });
      return;
    }
    this.socket.timeout(5000).emit(YjsEvents.SYNC_UPDATE, update, (err) => {
      if (err) {
        console.error(err);
        this.missedUpdates.push(update);
      }
    });
  }

  protected startSync() {
    if (this.socket.disconnected || !this._doc) return;
    const stateVector = Y.encodeStateVector(this._doc);
    this.socket.emit(YjsEvents.SYNC_STEP_1, stateVector);
    if (this.missedUpdates.length) {
      const update = Y.mergeUpdates(this.missedUpdates);
      this.missedUpdates = [];
      this.emitUpdate(update);
    }
  }

  protected onSocketConnection = async (): Promise<void> => {
    await this.initDocument();
    this.status = ConnectionStatus.connected;
    this.startSync();

    if (this.awareness.getLocalState() !== null) {
      this.socket.emit(
        YjsEvents.AWARENESS_UPDATE,
        AwarenessProtocol.encodeAwarenessUpdate(this.awareness, [
          this._doc?.clientID,
        ])
      );
    }

    this.setResyncInterval(BaseYjsProvider.defaultResyncInterval);
  };

  public setResyncInterval(resyncInterval = 0) {
    if (resyncInterval <= 0) {
      return;
    }
    if (this.resyncInterval) {
      clearInterval(this.resyncInterval);
    }
    this.resyncInterval = setInterval(() => {
      this.startSync();
    }, resyncInterval);
  }

  public disconnect(): void {
    if (!this.socket || !this.socket.connected) return;
    if (this.bcconnected) this.disconnectBc();
    this.socket.disconnect();
  }

  protected onSocketDisconnection = async (
    event: Socket.DisconnectReason
  ): Promise<void> => {
    this.emit(EmittedEvents.connectionClose, [event, this]);
    this.synced = false;
    this.initialized = false;
    AwarenessProtocol.removeAwarenessStates(
      this.awareness,
      Array.from(this.awareness.getStates().keys()).filter(
        (client) => client !== this._doc?.clientID
      ),
      this
    );
    this.status = ConnectionStatus.disconnected;

    // Reconnect socket if the reason is server disconnection
    if (event === "io server disconnect") {
      this.connect();
    }
  };

  protected onSocketConnectionError = (error: Error): void => {
    console.info(error);
    this.emit(EmittedEvents.connectionError, [error, this]);
  };

  public destroy(): void {
    if (this.resyncInterval != null) clearInterval(this.resyncInterval);

    this.destroySyncListeners();
    this.destroyAwarenessListeners();
    this.disconnect();

    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
    } else if (typeof process !== "undefined") {
      process.off("exit", this.beforeUnloadHandler);
    }

    this._doc?.destroy();
    this.status = ConnectionStatus.destroyed;
    this._doc = null;
    super.destroy();
  }

  protected onUpdateDoc = (
    update: Uint8Array,
    origin: BaseYjsProvider
  ): void => {
    if (origin === this) return;
    if (this.isStatic) {
      if (this.notifiedAboutStatic) return;

      this.notifiedAboutStatic = true;
      this.emit(EmittedEvents.staticEdit, []);
      return;
    }

    this.emitUpdate(update);

    if (!this.bcconnected) return;

    bc.publish(
      this._broadcastChannel,
      {
        type: BcEvents.syncUpdate,
        data: update,
      },
      this
    );
  };

  protected onSocketSyncStep2 = (update: Uint8Array | undefined) => {
    if (!this._doc || this.isStatic) return;
    if (!update || !update.byteLength) {
      return;
    }
    Y.applyUpdate(this._doc, new Uint8Array(update));
  };

  protected onSocketSyncInitStep2 = (update: Uint8Array | undefined) => {
    this.synced = true;
    if (!this._doc || this.isStatic) return;
    if (!update || !update.byteLength) {
      return;
    }
    Y.applyUpdate(this._doc, new Uint8Array(update), this);
  };

  protected onSocketSyncStep = (
    stateVector: ArrayBuffer,
    syncStep2: (update: Uint8Array) => void
  ) => {
    if (!this._doc || this.isStatic) return;
    const update = Y.encodeStateAsUpdate(
      this._doc,
      new Uint8Array(stateVector)
    );
    if (update.length > 2e6) {
      return;
    }
    syncStep2(update);
  };

  protected onSocketSyncInit = (
    syncCallback: (vectorState: Uint8Array) => void
  ) => {
    if (!this._doc || this.isStatic) return;
    const vector = Y.encodeStateVector(this._doc);
    syncCallback(vector);
  };

  protected onSocketSyncUpdate = (update: ArrayBuffer): void => {
    if (!this._doc || this.isStatic) return;
    Y.applyUpdate(this._doc, new Uint8Array(update), this);
  };

  protected onSocketAwarenessUpdate = (update: ArrayBuffer): void => {
    AwarenessProtocol.applyAwarenessUpdate(
      this.awareness,
      new Uint8Array(update),
      this
    );
  };

  protected onSocketSyncUpdateUrlDone = async (ids: string[]) => {
    if (!this._doc || this.isStatic) return;
    try {
      const res = await Promise.all(
        ids.map((id) =>
          this.downloadUpdate(id).catch((err) =>
            console.error(err)
          )
        )
      );
      res.forEach((data) => {
        if (data) {
          try {
            Y.applyUpdate(this._doc, new Uint8Array(data), this);
          } catch (err) {
            console.error(err);
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  protected onAwarenessUpdate = (
    diff: AwarenessDiff,
    origin: BaseYjsProvider | null
  ): void => {
    const changedClients = diff.added.concat(diff.updated).concat(diff.removed);
    this.socket.emit(
      YjsEvents.AWARENESS_UPDATE,
      AwarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
    );

    this.emit(EmittedEvents.awarenessChange, [diff, origin]);
    if (!this.bcconnected) return;

    bc.publish(
      this._broadcastChannel,
      {
        type: BcEvents.awarenessUpdate,
        data: AwarenessProtocol.encodeAwarenessUpdate(
          this.awareness,
          changedClients
        ),
      },
      this
    );
  };

  protected beforeUnloadHandler = (): void => {
    if (!this._doc) return;
    AwarenessProtocol.removeAwarenessStates(
      this.awareness,
      [this._doc?.clientID],
      "window unload"
    );
  };

  protected connectBc(): void {
    if (!this.bcconnected) {
      bc.subscribe(this._broadcastChannel, this.onBroadcastChannelMessage);
      this.bcconnected = true;
    }
    bc.publish(
      this._broadcastChannel,
      { type: BcEvents.syncStep1, data: Y.encodeStateVector(this._doc) },
      this
    );
    bc.publish(
      this._broadcastChannel,
      { type: BcEvents.syncStep2, data: Y.encodeStateAsUpdate(this._doc) },
      this
    );
    bc.publish(
      this._broadcastChannel,
      { type: BcEvents.queryAwareness, data: null },
      this
    );
    bc.publish(
      this._broadcastChannel,
      {
        type: BcEvents.awarenessUpdate,
        data: AwarenessProtocol.encodeAwarenessUpdate(this.awareness, [
          this._doc?.clientID,
        ]),
      },
      this
    );
  }

  protected disconnectBc(): void {
    bc.publish(
      this._broadcastChannel,
      {
        type: BcEvents.awarenessUpdate,
        data: AwarenessProtocol.encodeAwarenessUpdate(
          this.awareness,
          [this._doc?.clientID],
          new Map()
        ),
      },
      this
    );

    bc.unsubscribe(this._broadcastChannel, this.onBroadcastChannelMessage);
    this.bcconnected = false;
  }

  protected onBroadcastChannelMessage = (
    message: { type: string; data: any },
    origin: BaseYjsProvider
  ): void => {
    if (origin === this || message.type.length === 0) {
      return;
    }
    switch (message.type) {
      case BcEvents.syncStep1:
        bc.publish(
          this._broadcastChannel,
          {
            type: BcEvents.syncStep2,
            data: Y.encodeStateAsUpdate(this._doc, message.data),
          },
          this
        );
        break;

      case BcEvents.syncStep2:
        Y.applyUpdate(this._doc, new Uint8Array(message.data), this);
        break;

      case BcEvents.syncUpdate:
        Y.applyUpdate(this._doc, new Uint8Array(message.data), this);
        break;

      case BcEvents.queryAwareness:
        bc.publish(
          this._broadcastChannel,
          {
            type: BcEvents.awarenessUpdate,
            data: AwarenessProtocol.encodeAwarenessUpdate(
              this.awareness,
              Array.from(this.awareness.getStates().keys())
            ),
          },
          this
        );
        break;

      case BcEvents.awarenessUpdate:
        AwarenessProtocol.applyAwarenessUpdate(
          this.awareness,
          new Uint8Array(message.data),
          this
        );
        break;

      default:
        break;
    }
  };
}
