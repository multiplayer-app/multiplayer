import { useEffect, useState } from "react";
import {
  formatTime,
  getPosition,
  getReplayerContext,
  getWidth,
} from "../../../utils";
import { useReplayerOverlay } from "../ReplayerOverlay";
import { useDebugSessionNotes } from "../../../DebugSessionNotesContext";
import { EventType } from "rrweb";
import { logLevelColorMap } from "../../../DebugSession.configs";
import { CustomEvent, InactivePeriod } from "../ReplayController/types";
import { SessionNoteType } from "@multiplayer/types";
import { getInactivePeriods } from "../utils";

const INDICATOR_CLUSTER_RATIO = 0.0025;
const MIN_INDICATOR_CLUSTER_WINDOW_MS = 500;
const MAX_INDICATOR_CLUSTER_WINDOW_MS = 2000;

const getIndicatorClusterWindow = (start: number, end: number) => {
  const duration = Math.max(0, end - start);

  return Math.min(
    MAX_INDICATOR_CLUSTER_WINDOW_MS,
    Math.max(
      MIN_INDICATOR_CLUSTER_WINDOW_MS,
      duration * INDICATOR_CLUSTER_RATIO
    )
  );
};

const buildClusterIndicator = (cluster: CustomEvent[]) => {
  const [representative] = cluster;

  if (cluster.length === 1) return representative;

  return {
    ...representative,
    sourceName: representative.sourceName ?? representative.name,
    name: `${representative.name} (+${cluster.length - 1})`,
    clusterCount: cluster.length,
  };
};

const clusterIndicatorsByTimestamp = (
  indicators: CustomEvent[],
  clusterWindowMs: number
) => {
  if (indicators.length < 2) return indicators;

  const sortedIndicators = [...indicators].sort(
    (a, b) => a.timestamp - b.timestamp
  );
  const clusteredIndicators: CustomEvent[] = [];
  let cluster: CustomEvent[] = [];

  sortedIndicators.forEach((indicator) => {
    const clusterStart = cluster[0];

    if (
      clusterStart &&
      indicator.timestamp - clusterStart.timestamp > clusterWindowMs
    ) {
      clusteredIndicators.push(buildClusterIndicator(cluster));
      cluster = [];
    }

    cluster.push(indicator);
  });

  if (cluster.length > 0) {
    clusteredIndicators.push(buildClusterIndicator(cluster));
  }

  return clusteredIndicators;
};

export const useCustomEventsState = (tags?: Record<string, string>) => {
  const { notes } = useDebugSessionNotes();
  const { replayer } = useReplayerOverlay();
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [noteIndicators, setNoteIndicators] = useState<CustomEvent[]>([]);
  const [inactivePeriods, setInactivePeriods] = useState<InactivePeriod[]>([]);

  useEffect(() => {
    const updateCustomEvents = () => {
      const { start, end, events } = getReplayerContext(replayer);
      const customEvents: CustomEvent[] = [];
      const clusterWindowMs = getIndicatorClusterWindow(start, end);

      events.forEach((event) => {
        switch (event.type) {
          case EventType.Custom:
            customEvents.push({
              name: event.data.tag,
              background: "rgb(73, 80, 246)",
              position: `${getPosition(start, end, event.timestamp)}%`,
              timestamp: event.timestamp,
              timeOffset: event.timestamp - start,
            });
            break;
          case EventType.Plugin:
            if (event.data.plugin === "rrweb/console@1" && event.data.payload) {
              const payload = event.data.payload as any;
              customEvents.push({
                name: `Console ${payload.level}`,
                background:
                  logLevelColorMap[payload.level] || "rgb(73, 80, 246)",
                position: `${getPosition(start, end, event.timestamp)}%`,
                timestamp: event.timestamp,
                timeOffset: event.timestamp - start,
              });
            }
            break;
          default:
            break;
        }
      });

      setEvents(clusterIndicatorsByTimestamp(customEvents, clusterWindowMs));
    };

    const updateInactivePeriods = () => {
      try {
        const { start, end, events } = getReplayerContext(replayer);
        const periods = getInactivePeriods(
          events,
          replayer.config.inactivePeriodThreshold
        );

        const periodsData = periods.map((period) => ({
          name: "inactive period",
          background: "bg.subtle",
          position: `${getPosition(start, end, period[0])}%`,
          width: `${getWidth(start, end, period[0], period[1])}%`,
          timestamp: period[1],
          timeOffset: period[1] - start,
        }));

        setInactivePeriods(periodsData);
      } catch (e) {
        // For safety concern, if there is any error, the main function won't be affected.
        setInactivePeriods([]);
      }
    };

    if (replayer) {
      updateCustomEvents();
      updateInactivePeriods();
    }
  }, [replayer, getReplayerContext]);

  useEffect(() => {
    if (!replayer) return;
    const { start, end } = getReplayerContext(replayer);
    const clusterWindowMs = getIndicatorClusterWindow(start, end);
    const indicators: CustomEvent[] = [];

    notes[SessionNoteType.Sketch].forEach((note) => {
      indicators.push({
        name: `Note at ${formatTime(note.timestamp)}`,
        background: "green.400",
        position: `${getPosition(start, end, note.timestamp + start)}%`,
        timestamp: note.timestamp + start,
        timeOffset: note.timestamp,
      });
    });

    notes[SessionNoteType.Bookmark].forEach((note) => {
      indicators.push({
        name: `Bookmark at ${formatTime(note.timestamp)}`,
        background: "blue.400",
        position: `${getPosition(start, end, note.timestamp + start)}%`,
        timeOffset: note.timestamp,
        timestamp: note.timestamp + start,
      });
    });

    setNoteIndicators(
      clusterIndicatorsByTimestamp(indicators, clusterWindowMs)
    );
  }, [replayer, notes, getReplayerContext]);

  return { events, noteIndicators, inactivePeriods };
};
