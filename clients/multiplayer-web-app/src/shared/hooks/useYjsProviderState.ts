import * as Y from "yjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConnectionStatus, SocketErrorCodes } from "shared/models/enums";
import {
  ClientState, EntityStateParams,
  ProviderConfig, RequestStateParams, SessionNoteStateParams, SocketNamespace, YjsProviderState,
} from 'shared/models/interfaces';

import { BaseYjsProvider, EmittedEvents } from 'integrations/BaseYjsProvider';
import { useAuth } from "shared/providers/AuthContext";
import { SocketError } from "@multiplayer/types";
import { config } from "../../config";
import useMessage from "./useMessage";
import { YjsSocketIOProvider } from '../../integrations/YjsSocketIOProvider';
import { SessionNotesSocketIOProvider } from '../../integrations/SessionNotesSocketIOProvider';

const baseURL = config.REACT_APP_API_BASE_URL || "";
const collaborationPrefix = config.REACT_APP_COLLABORATION_PREFIX;

function getYjsProvider(
  namespace: SocketNamespace,
  params: EntityStateParams | RequestStateParams | SessionNoteStateParams,
  config: ProviderConfig = {}): BaseYjsProvider {

  switch (namespace) {
    case SocketNamespace.ENTITY:
    case SocketNamespace.REQUEST:
      const entityParams = params as EntityStateParams | RequestStateParams;
      return new YjsSocketIOProvider(
        `${baseURL}/${namespace}`,
        `${collaborationPrefix}/ws`,
        entityParams,
        config,
      );
    case SocketNamespace.SESSION_NOTES:
      const sessionParams = params as SessionNoteStateParams;
      return new SessionNotesSocketIOProvider(
        `${baseURL}/${namespace}`,
        `${collaborationPrefix}/ws`,
        sessionParams,
        config,
      );
  }
}

function getConnectionPath(namespace: SocketNamespace, params: EntityStateParams | RequestStateParams | SessionNoteStateParams): string {
  switch (namespace) {
    case SocketNamespace.ENTITY:
      const entityParams = params as EntityStateParams;
      return `${namespace}/${entityParams.projectId}/${entityParams.branchId}/${entityParams.entityId}`;
    case SocketNamespace.REQUEST:
      const { projectId, branchId } = params as RequestStateParams;
      return `${namespace}/${projectId}/${branchId}`;
    case SocketNamespace.SESSION_NOTES:
      const { sessionId } = params as SessionNoteStateParams;
      return `${namespace}/${sessionId}`;
    default:
      return ''
  }
}

export function useYjsProviderState<T extends BaseYjsProvider>(
  params: EntityStateParams | RequestStateParams | SessionNoteStateParams,
  nameSpace: SocketNamespace = SocketNamespace.ENTITY,
  configs: ProviderConfig,
  maxConnections: number
): YjsProviderState<T> {
  const providers = useRef<Map<string, T>>(new Map());
  const providersQueue = useRef<string[]>([]);

  const { signOut } = useAuth();
  const [error, setError] = useState<SocketError>();
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [clients, setClients] = useState<ClientState[]>([]);
  const [provider, setProvider] = useState<T | null>(null);
  const [status, setStatus] = useState<string>(ConnectionStatus.disconnected);
  const [triggerInitProviderEffect, setTriggerInitProviderEffect] = useState(false);
  const message = useMessage();

  const refreshConnections = useCallback((currentBranchId: string) => {
    //todo: get rid of this method in topLevel effect
    const regexp = new RegExp(
      `^/yjs|([A-Fa-f0-9]{24})/${currentBranchId}/([A-Fa-f0-9]{24})$`
    );
    const found = Array.from(providers.current.keys()).filter((path) =>
      path.match(regexp)
    );
    if (found.length) {
      found.forEach((path) => closeConnection(path));
      setTriggerInitProviderEffect((prev) => !prev); //todo: should it be done only if docc is visible??
    }
  }, []);

  const onAwarenessUpdate = useCallback((socketIOProvider: BaseYjsProvider) => {
    const clients = Object.values(
      Array.from(socketIOProvider.awareness.getStates().keys()).reduce(
        (acc, key: number) => {
          const state = socketIOProvider.awareness
            .getStates()
            .get(key) as ClientState;
          if (state && state.user) {
            // Blocknote Collaborative cursor plugin requires 'name' parameter for user
            state.user["name"] = state.user.username;
            acc[state.user._id] = state;
          }
          return acc;
        },
        {} as Record<string, ClientState>
      )
    );

    setClients((prev) =>
      JSON.stringify(prev) === JSON.stringify(clients) ? prev : clients
    );
  }, []);

  const closeConnection = useCallback((path) => {
    if (providers.current.has(path)) {
      const provider = providers.current.get(path);
      providers.current.delete(path);
      provider?.destroy();
      providersQueue.current = providersQueue.current.filter((c) => c !== path);
    }
  }, []);

  const getConnection = useCallback((connectionPath: string) => {
    if (!providers.current.has(connectionPath)) {
      const provider = getYjsProvider(nameSpace, params, configs)
      providers.current.set(connectionPath, provider as T);
      providersQueue.current.push(connectionPath);

      if (providersQueue.current.length > maxConnections) {
        const oldestTabId = providersQueue.current.shift();
        closeConnection(oldestTabId);
      }
      return provider;
    } else {
      const provider = providers.current.get(connectionPath);
      if (provider.status === ConnectionStatus.destroyed) {
        providers.current.delete(connectionPath);
        return getConnection(connectionPath);
      }

      setError(null);
      setDoc(provider.doc);
      setStatus(provider.status);
      return provider;
    }
  }, [nameSpace, params, maxConnections]);


  useEffect(() => {
    const connectionPath = getConnectionPath(nameSpace, params);
    const _provider = getConnection(connectionPath);

    const onChange = (e, origin) => {
      if (origin === "local") return;
      onAwarenessUpdate(_provider);
    };

    const onSync = (isSync: boolean) => {
      if (isSync) {
        setDoc(_provider.doc);
      } else {
        setDoc(null);
      }
    };

    const onDocumentError = (error: any) => {
      message.handleError(error);
    };

    const onError = (error: SocketError) => {
      switch (error.data?.code) {
        case SocketErrorCodes.UNAUTHORIZED:
          signOut(window.location.pathname);
          break;
        default:
          setError(error);
          setStatus(ConnectionStatus.failed);
          providers.current.delete(connectionPath);
          providersQueue.current = providersQueue.current.filter(
            (c) => c !== connectionPath
          );
          break;
      }
    };

    const onStatus = ({ status: _status }: { status: string }) => {
      if (_status) setStatus(_status);
    };

    const onDocDestroy = () => {
      closeConnection(connectionPath);
      setTriggerInitProviderEffect((prev) => !prev);
    };

    const onStaticEdit = () => {
      message.warning(
        "You are in the static document, your changes will not be saved"
      );
    };

    _provider.on(EmittedEvents.awarenessChange, onChange);
    _provider.on(EmittedEvents.sync, onSync);
    _provider.on(EmittedEvents.status, onStatus);
    _provider.on(EmittedEvents.error, onDocumentError);
    _provider.on(EmittedEvents.connectionError, onError);
    _provider.on(EmittedEvents.docDestroy, onDocDestroy);
    _provider.on(EmittedEvents.staticEdit, onStaticEdit);
    setProvider(_provider as T);


    return () => {
      _provider.off(EmittedEvents.awarenessChange, onChange);
      _provider.off(EmittedEvents.sync, onSync);
      _provider.off(EmittedEvents.status, onStatus);
      _provider.off(EmittedEvents.connectionError, onError);
      _provider.off(EmittedEvents.error, onDocumentError);
      _provider.off(EmittedEvents.docDestroy, onDocDestroy);
      _provider.off(EmittedEvents.staticEdit, onStaticEdit);

      setProvider(null);
      setClients([]);
      setDoc(null);
    };
  }, [nameSpace, params, signOut, triggerInitProviderEffect, onAwarenessUpdate, closeConnection, getConnection, message]);

  useEffect(() => {
    let idleTimeout;
    let onIdle = false;
    const startIdleTimer = () => {
      idleTimeout = setTimeout(() => {
        onIdle = true;
        providersQueue.current.forEach((path) => {
          closeConnection(path);
        });
      }, 5 * 60 * 1000);
    };

    const onVisibilityChange = () => {
      clearTimeout(idleTimeout);
      if (document.visibilityState !== "visible") {
        startIdleTimer();
      } else {
        if (onIdle) {
          onIdle = false;
          setTriggerInitProviderEffect((prev) => !prev);
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearTimeout(idleTimeout);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // Close all connections
    return () => {
      providersQueue.current.forEach((path) => {
        const provider = providers.current.get(path);
        provider?.destroy();
      });
    };
  }, []);

  return { provider, doc, status, error, clients, refreshConnections };
}
