import * as Y from "yjs";
import * as bc from "lib0/broadcastchannel";
import {
  EntityCommitStorageType,
  EntityType,
  IEntity,
  IEntityCommit,
  RequestEntityType,
  YjsEvents,
} from "@multiplayer/types";
import { EntityStateParams, RequestStateParams, ProviderConfig } from 'shared/models/interfaces';
import { EntityConverter } from "@multiplayer/entity";
import {
  downloadEntityUpdate,
  getBranchState,
  getEntityCommitContents,
  uploadEntityUpdate,
} from "../shared/services/version.service";
import { getGitRepositoryFiles } from "../shared/services/git.service";
import { DocumentHelper } from "./documents/helper";
import { RequestDocument } from "./documents/request.document";
import { EntityDocument } from "./documents/entity-document";
import { BaseYjsProvider, EmittedEvents } from "./BaseYjsProvider";

export class YjsSocketIOProvider extends BaseYjsProvider {
  public entityId?: string;
  public branchId: string;
  public projectId: string;
  private entityType?: EntityType;
  protected isStatic = false;
  protected notifiedAboutStatic = false;
  private initCommitId: string;
  private isParentState = false;

  constructor(
    url: string,
    apiPath: string,
    params: EntityStateParams | RequestStateParams,
    { auth = {}, query = {} }: ProviderConfig
  ) {
    const entityNamespace = 'entityId' in params ? `/${params['entityId']}` : "";
    const nameSpace = `${params.projectId}/${params.branchId}${entityNamespace}`;

    super(url, apiPath, nameSpace, { auth, query }, params);

    this.branchId = params.branchId;
    this.projectId = params.projectId;

    this.entityId = params['entityId'];
    this.entityType = params["entityType"];

    this.onMetaRefresh = this.onMetaRefresh.bind(this);
  }


  protected setupDocument(params: EntityStateParams | RequestStateParams) {
    const callbacks = {
      onError: (err: any) => this.emit(EmittedEvents.error, [err]),
    };

    if (params['entityId'] && params["entityType"]) {
      const constructor = DocumentHelper.getDocumentConstructorByEntityType(
        params["entityType"]
      );

      return new constructor({
        projectId: params.projectId,
        branchId: params.branchId,
        entityId: params['entityId'],
        callbacks,
      });
    }
    return new RequestDocument(
      params.projectId,
      params.branchId,
      RequestEntityType.MERGE_REQUEST,
      callbacks
    );
  }

  protected async uploadUpdate(updateId: string, update: Uint8Array): Promise<void> {
    await uploadEntityUpdate(this.branchId, this.entityId, updateId, update);
  }

  private async getEntitySnapshot(
    entityCommit: IEntityCommit,
    entity: IEntity
  ): Promise<Uint8Array | undefined> {
    if (entityCommit.storageType === EntityCommitStorageType.S3) {
      return getEntityCommitContents(
        entityCommit.projectBranch,
        entityCommit.entity,
        entityCommit._id
      );
    }

    if (
      entityCommit.storageType === EntityCommitStorageType.GIT &&
      entity.gitRef
    ) {
      return this.getEntitySnapshotFromGit(entity);
    }
    return undefined;
  }

  private async getEntitySnapshotFromGit(entity: IEntity) {
    if (!entity.gitRef) {
      throw new Error("Not enough records to find entity document");
    }
    const contents = await getGitRepositoryFiles(
      this.projectId,
      entity.gitRef.repositoryId,
      entity.gitRef.path,
      { ref: entity.gitRef.branch }
    );
    const extension = entity.gitRef.path
      ? entity.gitRef.path.split(".").pop()?.toLowerCase()
      : "txt";

    return EntityConverter.convertSourceToState(entity.type, entity.key, contents, extension);
  }

  private async getLatestEntityState(branchId: string, entityId: string) {
    const entityStateResponse = await getBranchState(branchId, { entityId });

    if (!entityStateResponse?.data?.length) {
      throw new Error(`Entity not found in branch`);
    }
    return entityStateResponse.data[0];
  }

  protected async initDocument() {
    if (!this.entityId) {
      this.initialized = true;
      return;
    }

    try {
      const latestState = await this.getLatestEntityState(
        this.branchId,
        this.entityId
      );
      if (this.initCommitId === latestState.entityCommit._id) {
        this.initialized = true;
        return;
      }

      if (
        latestState.entityCommit.storageType === EntityCommitStorageType.GIT &&
        latestState.entity.gitRef
      ) {
        this.isStatic = true;
      }
      let state = await this.getEntitySnapshot(
        latestState.entityCommit,
        latestState.entity
      );
      if (!state) {
        console.warn("SNAPSHOT IS MISSING!!!");
        state = EntityConverter.getInitialContent(latestState.entity.type);
      }

      Y.applyUpdate(this._doc, state, this);

      EntityConverter.applyDocumentMigration(
        latestState.entity.type,
        this._doc
      );

      if (this._doc instanceof EntityDocument) {
        await this._doc.init(
          latestState.entity,
          new Date(latestState.entity.updatedAt).getTime()
        );
      }
      this.initCommitId = latestState.entityCommit._id;
      if (this.branchId !== latestState.entityCommit.projectBranch) {
        this.isParentState = true;
      }
      this.initialized = true;
    } catch (err) {
      console.warn("Cannot init the state", err);
      this.onSocketConnectionError(err);
      this.disconnect();
    }
  }

  protected onUpdateDoc = (
    update: Uint8Array,
    origin: BaseYjsProvider
  ): void => {
    if (origin === this) return;
    if (this.isStatic) {
      // TODO: notify user that "You are going to edit file from the git repository. To edit a file, multiplayer need to create internal file copy with your changes. Do you want to proceed?"
      if (this.notifiedAboutStatic) return;

      this.notifiedAboutStatic = true;
      this.emit(EmittedEvents.staticEdit, []);
      return;
    }

    if (this.isParentState) {
      this.isParentState = false;
      this.setResyncInterval(BaseYjsProvider.defaultResyncInterval);
    }
    this.emitUpdate(update);

    if (!this.bcconnected) return;

    // Broadcast channel functionality is handled in base class
    // We need to manually trigger the broadcast channel update
    bc.publish(
      this._broadcastChannel,
      {
        type: "sync-update",
        data: update,
      },
      this
    );
  };
  protected downloadUpdate(id: string) {
    return downloadEntityUpdate(this.branchId, this.entityId, id)
  }

  private onMetaRefresh(entity: IEntity, timestamp: number) {
    if (this.doc instanceof EntityDocument) {
      const adjustedTimestamp = timestamp - 1500; // dirty hack to avoid metadata overwrite in docs
      this.doc.setSummary(entity.metadata, adjustedTimestamp);
      this.doc.setName(entity.key, adjustedTimestamp);
    }
  }

  protected initSyncListeners(): void {
    super.initSyncListeners();
    this.socket.on(YjsEvents.META_REFRESH, this.onMetaRefresh);
  }

  protected destroySyncListeners(): void {
    super.destroySyncListeners();
    this.socket.off(YjsEvents.META_REFRESH, this.onMetaRefresh);
  }
}
