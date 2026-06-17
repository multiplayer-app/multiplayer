import type { Replayer } from "rrweb";

export interface CustomEvent {
  name: string;
  sourceName?: string;
  background: string;
  position: string;
  timeOffset: number;
  timestamp: number;
  clusterCount?: number;
}

export interface InactivePeriod {
  name: string;
  background: string;
  position: string;
  width: string;
  timeOffset: number;
  timestamp: number;
}

export interface ReplayControllerProps {
  replayer: Replayer;
  autoPlay: boolean;
  liveMode: boolean;
  tags?: Record<string, string>;
  metadata: any;
  selectNodeByTimestamp: (time: number) => void;

  // speed: number;
  // speedOption: number[];
}
