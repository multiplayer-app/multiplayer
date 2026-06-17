import { useEffect, useRef } from 'react';
import { ProjectSourceType } from 'shared/models/enums';
import { useEventEmitter } from './useEventEmitter';

/**
 * Custom hook for subscribing to project updates
 * @param type - The type of entity to subscribe to (e.g., 'session', 'entity', 'flow')
 * @param id - The ID of the entity to subscribe to
 * @param callback - The callback function to execute when updates occur
 * @param dependencies - Optional dependencies array for the callback
 */
export const useEventSubscription = (
  type: ProjectSourceType,
  id: string,
  callback: (data: any) => void,
  dependencies: any[] = []
) => {
  const { subscribeToEvent } = useEventEmitter();
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...dependencies]);

  useEffect(() => {
    const unsubscribe = subscribeToEvent(type, id, (data) => {
      callbackRef.current(data);
    });

    return unsubscribe;
  }, [type, id, subscribeToEvent]);
};

/**
 * Hook specifically for session updates
 */
export const useSessionSubscription = (
  sessionId: string,
  callback: (data: any) => void,
  dependencies: any[] = []
) => {
  return useEventSubscription(ProjectSourceType.DEBUGGER, sessionId, callback, dependencies);
};

/**
 * Hook specifically for entity updates
 */
export const useEntitySubscription = (
  entityId: string,
  callback: (data: any) => void,
  dependencies: any[] = []
) => {
  return useEventSubscription(ProjectSourceType.ENTITY, entityId, callback, dependencies);
};

/**
 * Hook specifically for flow updates
 */
export const useFlowSubscription = (
  flowId: string,
  callback: (data: any) => void,
  dependencies: any[] = []
) => {
  return useEventSubscription(ProjectSourceType.FLOWS, flowId, callback, dependencies);
};