import {
  CanvasArg,
  canvasEventWithTime,
  canvasMutationData,
  canvasMutationParam,
  eventWithTime,
  EventType,
  IncrementalSource,
} from "@rrweb/types";
import { canvasMutation, Replayer } from "rrweb";

type GLVarMap = Map<string, any[]>;
type CanvasContexts =
  | CanvasRenderingContext2D
  | WebGLRenderingContext
  | WebGL2RenderingContext;
const webGLVarMap: Map<CanvasContexts, GLVarMap> = new Map();

function isCanvasMutation(e: eventWithTime): e is canvasEventWithTime {
  return (
    e.type === EventType.IncrementalSnapshot &&
    e.data.source === IncrementalSource.CanvasMutation
  );
}

function quickFindClosestCanvasEventIndex(
  events: canvasEventWithTime[],
  target: canvasEventWithTime,
  start: number,
  end: number
): number {
  if (!target) {
    return -1;
  }

  if (start > end) {
    return end;
  }

  const mid = Math.floor((start + end) / 2);

  return target.timestamp <= events[mid].timestamp
    ? quickFindClosestCanvasEventIndex(events, target, start, mid - 1)
    : quickFindClosestCanvasEventIndex(events, target, mid + 1, end);
}

const PRELOAD_BUFFER_SIZE = 20;
const BUFFER_TIME = 30000; // 30 seconds

export const CanvasReplayerPlugin = (events: eventWithTime[]) => {
  const canvases = new Map<number, HTMLCanvasElement>([]);
  const containers = new Map<number, HTMLImageElement>([]);
  const imageMap = new Map<eventWithTime | string, HTMLImageElement>();
  const canvasEventMap = new Map<eventWithTime | string, canvasMutationParam>();
  const pruneQueue: eventWithTime[] = [];
  let nextPreloadIndex: number | null = null;

  const canvasMutationEvents = events.filter(isCanvasMutation);

  // Buffers mutations from user interactions before Replayer was ready
  const handleQueue = new Map<number, [canvasEventWithTime, Replayer]>();

  // only processes a single mutation event in cases when the user is scrubbing
  // avoids looking like the canvas is playing
  const processMutationSync = (
    e: canvasEventWithTime,
    { replayer }: { replayer: Replayer }
  ): void => {
    handleQueue.set(e.data.id, [e, replayer]);
    debouncedProcessQueuedEvents();
  };
  const debouncedProcessQueuedEvents = debounce(() => {
    Array.from(handleQueue.entries()).forEach(([id, [e, replayer]]) => {
      void (async () => {
        try {
          await processMutation(e, replayer);
          handleQueue.delete(id);
        } catch (e) {
          handleMutationError(e);
        }
      })();
    });
  }, 250);

  const deserializeAndPreloadCanvasEvents = async (
    data: canvasMutationData,
    event: eventWithTime
  ): Promise<void> => {
    if (!canvasEventMap.has(event)) {
      const status = { isUnchanged: true };

      if ("commands" in data) {
        const commands = await Promise.all(
          data.commands.map(async (c) => {
            const args = await Promise.all(
              (c.args as CanvasArg[]).map(
                deserializeCanvasArg(imageMap, null, status)
              )
            );
            return { ...c, args };
          })
        );
        if (!status.isUnchanged) {
          canvasEventMap.set(event, { ...data, commands });
        }
      } else {
        const args = await Promise.all(
          (data.args as CanvasArg[]).map(
            deserializeCanvasArg(imageMap, null, status)
          )
        );
        if (!status.isUnchanged) {
          canvasEventMap.set(event, { ...data, args });
        }
      }
    }
  };

  const cloneCanvas = (
    id: number,
    node: HTMLCanvasElement
  ): HTMLCanvasElement => {
    const cloneNode = node.cloneNode() as HTMLCanvasElement;
    canvases.set(id, cloneNode);
    document.adoptNode(cloneNode);
    return cloneNode;
  };

  const pruneBuffer = (event: eventWithTime): void => {
    while (pruneQueue.length) {
      const difference = Math.abs(event.timestamp - pruneQueue[0].timestamp);
      const eventToPrune = pruneQueue.shift();
      if (eventToPrune) {
        canvasEventMap.delete(eventToPrune);
      }
      if (
        difference <= BUFFER_TIME &&
        pruneQueue.length <= PRELOAD_BUFFER_SIZE
      ) {
        break;
      }
    }
  };

  const processMutation = async (
    e: canvasEventWithTime,
    replayer: Replayer
  ): Promise<void> => {
    pruneBuffer(e);
    pruneQueue.push(e);
    void preload(e);

    const data = e.data as canvasMutationData;
    const source = replayer.getMirror().getNode(data.id) as HTMLCanvasElement;
    const target =
      canvases.get(data.id) || (source && cloneCanvas(data.id, source));

    if (!target) {
      return;
    }

    if (source) {
      target.width = source.width;
      target.height = source.height;
    }

    await canvasMutation({
      event: e,
      mutation: data,
      target: target,
      imageMap,
      canvasEventMap,
      errorHandler: (error: unknown) => {
        handleMutationError(error);
      },
    });

    const img = containers.get(data.id);
    if (img) {
      target.toBlob(
        (blob) => {
          if (blob) {
            img.style.width = "initial";
            img.style.height = "initial";

            const url = URL.createObjectURL(blob);
            img.onload = () => URL.revokeObjectURL(url);
            img.src = url;
          }
        },
        "image/webp",
        0.4
      );
    }
  };

  const preload = async (currentEvent?: canvasEventWithTime): Promise<void> => {
    const currentIndex = nextPreloadIndex
      ? nextPreloadIndex
      : currentEvent
      ? quickFindClosestCanvasEventIndex(
          canvasMutationEvents,
          currentEvent,
          0,
          canvasMutationEvents.length
        )
      : 0;

    const eventsToPreload = canvasMutationEvents
      .slice(currentIndex, currentIndex + PRELOAD_BUFFER_SIZE)
      .filter(
        ({ timestamp }) =>
          !currentEvent || timestamp - currentEvent.timestamp <= BUFFER_TIME
      );

    nextPreloadIndex = currentIndex + 1;

    for (const event of eventsToPreload) {
      await deserializeAndPreloadCanvasEvents(
        event.data as canvasMutationData,
        event
      );
    }
  };

  void preload();

  return {
    onBuild: (node, { id }) => {
      if (!node) {
        return;
      }

      if (node.nodeName === "CANVAS" && node.nodeType === 1) {
        const el = containers.get(id) || document.createElement("img");
        (node as HTMLCanvasElement).appendChild(el);
        containers.set(id, el);
      }
    },

    handler: async (
      e: eventWithTime,
      isSync: boolean,
      { replayer }: { replayer: Replayer }
    ) => {
      const isCanvas = isCanvasMutation(e);

      if (isSync) {
        nextPreloadIndex = null;
        canvasEventMap.clear();

        if (isCanvas) {
          processMutationSync(e, { replayer });
        } else {
          pruneBuffer(e);
        }
        pruneBuffer(e);
      } else if (isCanvas) {
        void processMutation(e, replayer).catch(handleMutationError);
      }
    },
  } as any;
};

const handleMutationError = (error: unknown): void => {
  // Todo handle error
  // console.error(error);
};

const deserializeCanvasArg = (
  imageMap: Replayer["imageMap"],
  ctx: CanvasContexts | null,
  preload?: {
    isUnchanged: boolean;
  }
): ((arg: CanvasArg) => Promise<any>) => {
  return async (arg: CanvasArg): Promise<any> => {
    if (arg && typeof arg === "object" && "rr_type" in arg) {
      if (preload) {
        preload.isUnchanged = false;
      }
      if (arg.rr_type === "ImageBitmap" && "args" in arg) {
        const args: [ImageBitmapSource, ImageBitmapOptions?] =
          await deserializeCanvasArg(imageMap, ctx, preload)(arg.args);
        return await createImageBitmap(...args);
      }
      if ("index" in arg) {
        if (preload || ctx === null) {
          return arg;
        }
        const { rr_type: name, index } = arg;
        return variableListFor(ctx, name)[index];
      }
      if ("args" in arg) {
        return arg;
      }
      if ("base64" in arg) {
        return base64ArrayBuffer(arg.base64);
      }
      if ("src" in arg) {
        return arg;
      }
      if ("data" in arg && arg.rr_type === "Blob") {
        const blobContents = await Promise.all(
          arg.data.map(deserializeCanvasArg(imageMap, ctx, preload))
        );
        return new Blob(blobContents, {
          type: arg.type,
        });
      }
    } else if (Array.isArray(arg)) {
      return await Promise.all(
        arg.map(deserializeCanvasArg(imageMap, ctx, preload))
      );
    }
    return arg;
  };
};

const variableListFor = (ctx: CanvasContexts, ctor: string): any[] => {
  let contextMap = webGLVarMap.get(ctx);
  if (!contextMap) {
    contextMap = new Map();
    webGLVarMap.set(ctx, contextMap);
  }
  if (!contextMap.has(ctor)) {
    contextMap.set(ctor, []);
  }

  return contextMap.get(ctor) as any[];
};

const base64ArrayBuffer = (encodedString: string): ArrayBufferLike => {
  const data = base64ToUint8Array(encodedString);
  return data.buffer;
};

const base64ToUint8Array = (encodedString: string): Uint8Array => {
  const binString = atob(encodedString);
  const data = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    data[i] = binString.charCodeAt(i);
  }
  return data;
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
) => {
  let inDebounce: NodeJS.Timeout;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(this, args), delay);
  };
};
