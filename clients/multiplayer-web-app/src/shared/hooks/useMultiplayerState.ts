import { useEffect, useMemo } from 'react'
import { MultiplayerState, ProviderConfig, SocketNamespace } from 'shared/models/interfaces'

import { EntityType, WarningEvents } from '@multiplayer/types'
import { useEntities } from '../providers/EntitiesContext'
import { useYjsProviderState } from './useYjsProviderState'
import { YjsSocketIOProvider } from '../../integrations/YjsSocketIOProvider'



export function useMultiplayerState(
  projectId: string,
  branchId: string,
  entityId: string = undefined,
  nameSpace: SocketNamespace = SocketNamespace.ENTITY,
  configs: ProviderConfig,
  maxConnections: number,
  entityType?: EntityType
): MultiplayerState {
  const params = useMemo(() => {  //todo: move to useYjsProviderState
    return {
      projectId,
      branchId,
      entityId,
      entityType,
    }
  }, [projectId, branchId, entityId, entityType]);

  const { provider, doc, status, error, clients, refreshConnections } = useYjsProviderState<YjsSocketIOProvider>(params, nameSpace, configs, maxConnections)

  const { addListenerToBranch, allEntities } = useEntities();
  const entity = useMemo(() => {
    return allEntities.find((e) => e.entityId === entityId);
  }, [entityId, allEntities]);


  useEffect(() => {
    const onMerge = (res: {
      projectBranchTo: string;
      projectBranchFrom: string;
    }) => {
      refreshConnections(res.projectBranchTo);
    };

    const listener = addListenerToBranch(WarningEvents.MERGE_FINISHED, onMerge);

    return () => {
      listener();
    };
  }, [addListenerToBranch, refreshConnections]);

  return { provider, doc, status, error, clients, refreshConnections, entity };
}
