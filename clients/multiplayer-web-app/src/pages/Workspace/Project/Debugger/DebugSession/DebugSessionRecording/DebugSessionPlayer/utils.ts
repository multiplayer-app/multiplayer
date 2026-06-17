import { EventType, IncrementalSource } from "@rrweb/types";
import type { eventWithTime } from "@rrweb/types";

/**
 * Forked from 'rrweb' replay/index.ts. The original function is not exported.
 * Determine whether the event is a user interaction event
 * @param event - event to be determined
 * @returns true if the event is a user interaction event
 */
function isUserInteraction(event: eventWithTime): boolean {
  if (event.type !== EventType.IncrementalSnapshot) {
    return false;
  }
  return (
    event.data.source > IncrementalSource.Mutation &&
    event.data.source <= IncrementalSource.Input
  );
}

/**
 * Get periods of time when no user interaction happened from a list of events.
 * @param events - all events
 * @param inactivePeriodThreshold - threshold of inactive time in milliseconds
 * @returns periods of time consist with [start time, end time]
 */
export function getInactivePeriods(
  events: eventWithTime[],
  inactivePeriodThreshold: number
) {
  const inactivePeriods: [number, number][] = [];
  let lastActiveTime = events[0].timestamp;
  for (const event of events) {
    if (!isUserInteraction(event)) continue;
    if (event.timestamp - lastActiveTime > inactivePeriodThreshold) {
      inactivePeriods.push([lastActiveTime, event.timestamp]);
    }
    lastActiveTime = event.timestamp;
  }
  return inactivePeriods;
}
