import { useCallback, useEffect, useRef } from 'react';
import { eventWithTime, metaEvent } from '@rrweb/types';
import type { Replayer } from 'rrweb';
import { isConsoleEvent, newDebugSessionNode, isUserInteractionEvent, injectTracesToTree } from './utils';
import { EventType } from '@rrweb/types';

import {
  ILogData, ITraceData,
  IConsoleNode, DebugSessionNodeType,
  DebugSessionNodesState,
  IDebugSessionNode
} from './types';


interface UseLiveDataManagerReturn {
  injectLiveEvent: (eventData: eventWithTime) => void;
  injectLiveTrace: (traceData: ITraceData[]) => void;
  injectLiveLog: (logData: ILogData[]) => void;
  clearLiveData: () => void;
  setPlayerRef: (player: Replayer | null) => void;
  playerRef: Replayer | null;
}

export const useLiveDataManager = (
  setEvents: React.Dispatch<React.SetStateAction<eventWithTime[]>>,
  setSessionNodes: React.Dispatch<React.SetStateAction<DebugSessionNodesState>>,
  setMetadata: React.Dispatch<metaEvent>
): UseLiveDataManagerReturn => {

  const playerRef = useRef<Replayer | null>(null);

  // Debounced state updates for performance
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<{
    events: eventWithTime[];
    sessionNodes: Partial<DebugSessionNodesState>;
  }>({
    events: [],
    sessionNodes: {},
  });

  // Counter for session nodes to trigger flush when exceeding threshold
  const sessionNodesCountRef = useRef<number>(0);
  const SESSION_NODES_THRESHOLD = 20;

  const setPlayerRef = useCallback((player: Replayer | null) => {
    playerRef.current = player;
  }, []);

  const flushPendingUpdates = useCallback(() => {
    // Early return if no updates to process
    const hasEvents = pendingUpdatesRef.current.events.length > 0;
    const hasSessionNodes = sessionNodesCountRef.current > 0;

    if (!hasEvents && !hasSessionNodes) {
      return;
    }

    // Batch state updates for better performance
    if (hasEvents) {
      setEvents((prev) => {
        const newEvents = [...prev, ...pendingUpdatesRef.current.events]
          .sort((a, b) => a.timestamp - b.timestamp);
        return newEvents;
      });
      pendingUpdatesRef.current.events = [];
    }

    if (hasSessionNodes) {
      setSessionNodes((prev) => {
        const updated = { ...prev };
        // Process each node type efficiently
        Object.entries(pendingUpdatesRef.current.sessionNodes).forEach(([key, nodes]) => {
          if (!nodes || nodes.length === 0) return;

          const nodeType = key as DebugSessionNodeType;
          let existingNodes = updated[nodeType] || [];
          let processedNodes = nodes as any[];
          // Special handling for trace nodes with tree injection
          if (nodeType === DebugSessionNodeType.Trace) {
            const { tree, missingTraces } = injectTracesToTree(
              existingNodes as IDebugSessionNode<ITraceData>[],
              nodes as IDebugSessionNode<ITraceData>[]
            );
            existingNodes = [];
            processedNodes = tree;
            pendingUpdatesRef.current.sessionNodes[nodeType] = missingTraces;
          } else {
            pendingUpdatesRef.current.sessionNodes[nodeType] = [];
          }

          // Merge and sort nodes efficiently
          updated[nodeType] = [
            ...existingNodes,
            ...processedNodes
          ].sort((a, b) => a.timestamp - b.timestamp);
        });

        if (JSON.stringify(updated) === JSON.stringify(prev)) {
          return prev
        }
        return updated;
      });
    }

    // Reset session nodes counter after flush
    sessionNodesCountRef.current = 0;
  }, [setEvents, setSessionNodes]);

  const scheduleUpdate = useCallback(() => {
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Check if we should flush immediately based on session nodes count
    if (sessionNodesCountRef.current >= SESSION_NODES_THRESHOLD) {
      flushPendingUpdates();
    } else {
      // Debounce with timeout
      updateTimeoutRef.current = setTimeout(flushPendingUpdates, 2000);
    }
  }, [flushPendingUpdates]);

  const injectLiveEvent = useCallback((eventData: eventWithTime) => {
    // Add to pending updates
    pendingUpdatesRef.current.events.push(eventData);

    if (playerRef.current && typeof playerRef.current.addEvent === 'function') {
      try {
        playerRef.current.addEvent(eventData);
      } catch (error) {
        console.warn('Failed to inject event into rrweb player:', error);
      }
    }

    // Update console nodes if it's a console event
    if (isConsoleEvent(eventData)) {
      const consoleNode = newDebugSessionNode<IConsoleNode>(
        DebugSessionNodeType.Console,
        eventData
      );

      if (!pendingUpdatesRef.current.sessionNodes[DebugSessionNodeType.Console]) {
        pendingUpdatesRef.current.sessionNodes[DebugSessionNodeType.Console] = [];
      }
      pendingUpdatesRef.current.sessionNodes[DebugSessionNodeType.Console].push(consoleNode);
      sessionNodesCountRef.current++;
    }

    // Update metadata if it's a meta event
    if (eventData.type === EventType.Meta) {
      setMetadata(eventData as metaEvent);
    }

    scheduleUpdate();
  }, [scheduleUpdate, setMetadata]);

  const injectLiveTrace = useCallback((traceData: ITraceData[]) => {
    // Process each trace data item in the array
    traceData.forEach((traceItem) => {
      const nodeType = isUserInteractionEvent(traceItem)
        ? DebugSessionNodeType.Event
        : DebugSessionNodeType.Trace;

      const traceNode = newDebugSessionNode<ITraceData>(nodeType, traceItem);

      if (!pendingUpdatesRef.current.sessionNodes[nodeType]) {
        pendingUpdatesRef.current.sessionNodes[nodeType] = [];
      }
      pendingUpdatesRef.current.sessionNodes[nodeType].push(traceNode);
      sessionNodesCountRef.current++;
    });
    scheduleUpdate();
  }, [scheduleUpdate, setSessionNodes]);

  const injectLiveLog = useCallback((logData: ILogData[]) => {
    // Process each log data item in the array
    logData.forEach((logItem) => {
      const logNode = newDebugSessionNode<ILogData>(
        DebugSessionNodeType.Log,
        logItem
      );

      if (!pendingUpdatesRef.current.sessionNodes[DebugSessionNodeType.Log]) {
        pendingUpdatesRef.current.sessionNodes[DebugSessionNodeType.Log] = [];
      }
      pendingUpdatesRef.current.sessionNodes[DebugSessionNodeType.Log].push(logNode);
      sessionNodesCountRef.current++;
    });

    scheduleUpdate();
  }, [scheduleUpdate]);

  const clearLiveData = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    pendingUpdatesRef.current = {
      events: [],
      sessionNodes: {},
    };

    // Reset session nodes counter
    sessionNodesCountRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      clearLiveData()
    }
  }, [clearLiveData])

  return {
    injectLiveEvent,
    injectLiveTrace,
    injectLiveLog,
    clearLiveData,
    setPlayerRef,
    playerRef: playerRef.current,
  };
};