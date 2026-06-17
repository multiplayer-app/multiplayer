import { ComponentType, IFlow } from "@multiplayer/types";

import { getNestedProperty } from "shared/utils";
import { EntityWithMeta } from "shared/models/interfaces";

import { COLUMN_WIDTH } from "../configs";
import { DiagramProvider } from "../services";
import { getDiagramTheme } from "../theme";
import { DiagramEvents } from "../types";

import Application from "../Application";
import Edge from "../components/Edge";
import ComponentNode from "../components/ComponentNode";
import { DisplayObject, Graphics } from "pixi.js";
import Sequence from "./Sequence";
import { getNodeCenter } from "../helpers";

let _syncTimeout;

class FlowDiagram extends Application {
  edgesRefs = new Map<string, Edge>();
  nodeRefs = new Map<string, ComponentNode>();

  private _platformComponents: Map<string, EntityWithMeta> = null;
  public get platformComponents(): Map<string, EntityWithMeta> {
    return this._platformComponents;
  }
  public set platformComponents(v: Map<string, EntityWithMeta>) {
    this._platformComponents = v;
    this.renderNodesThrottle();
  }

  public get selectedComponents(): Set<ComponentNode> {
    return DiagramProvider.selectedComponents;
  }
  public get selectedEdges(): Set<Edge> {
    return DiagramProvider.selectedEdges;
  }

  constructor(public data: IFlow) {
    super({ readonly: true });
    this.viewport.container.on("moved", this.onViewportMoved.bind(this));
    this.on(DiagramEvents.theme_change, this.renderNodesThrottle);
  }

  private onViewportMoved() {
    const stickyTop = -16;
    const viewportY = this.viewport.container.top;
    const { x } = this.stage.nodesContainer;

    if (viewportY >= stickyTop) {
      this.stage.nodesContainer.position.set(
        x,
        Math.abs(viewportY - stickyTop)
      );
    }
  }

  private renderNodes = () => {
    this.stage.cleanup();
    const nodeRefs = new Map();
    const nodes = getFLowData(this.data, this.platformComponents);
    const items = this.data.sequence.filter(
      ({ parentSpanId }) =>
        !parentSpanId ||
        this.data.sequence.some(({ spanId }) => spanId === parentSpanId)
    );

    const sequences = groupDataByComponent(items);
    const lastSpan = items.length > 1 && items[items.length - 1];

    Object.values(nodes).forEach((node: any) => {
      let instance = this.nodeRefs.get(node.id);
      if (!instance) {
        instance = new ComponentNode(node);
      } else {
        instance.update(node);
      }
      this.stage.addNode(instance);
      this.renderVerticalLine(instance, lastSpan);
      nodeRefs.set(node.id, instance);
    });

    this.nodeRefs = nodeRefs;

    this.renderSequences(sequences);
    this.updateViewport();
  };

  private renderNodesThrottle = () => {
    clearTimeout(_syncTimeout);
    _syncTimeout = setTimeout(() => {
      this.renderNodes();
    }, 100);
  };

  private renderVerticalLine = (instance, lastSpan) => {
    if (!lastSpan) return;
    const [x, y] = getNodeCenter(instance);
    const lastY = 60 + (Number(lastSpan.spanId) - 1) * 60;
    const col = new Graphics();
    col.beginFill(getDiagramTheme().flow.columnHeader);
    col.drawRoundedRect(x - 4, y + 60, 8, lastY - y + 30, 3);
    col.endFill();
    this.stage.edgesContainer.addChild(col as DisplayObject);
  };

  private renderSequences = (sequences) => {
    for (const [componentName, sequence] of sequences) {
      sequence.requests.forEach((req) => {
        const source = this.nodeRefs.get(req.to);
        const target = this.nodeRefs.get(componentName);
        const instance = new Sequence(req, source, target);
        instance.appendTo(this.stage.edgesContainer);
      });
    }
  };

  setPlatformComponents(platformComponents: Map<string, EntityWithMeta>) {
    this.platformComponents = platformComponents;
  }

  selectAll(): void {
    DiagramProvider.selectAllInstances();
  }

  deselectAll(): void {
    DiagramProvider.deselectAllInstances();
  }
}

export default FlowDiagram;

function getFLowData(flows, platformComponents) {
  let index = 1;
  const nodes = {};

  flows.sequence.forEach((s) => {
    const entity = platformComponents.get(s.componentName);
    if (!nodes[s.componentName]) {
      const metadata = getNestedProperty(entity, ["metadata"], {
        type: ComponentType.GENERIC,
      });
      nodes[s.componentName] = {
        id: s.componentName,
        data: metadata,
        type: metadata.type,
        linkedTo: entity?.entityId,
        state: { y: 0, x: COLUMN_WIDTH * index++ },
        name: getNestedProperty(entity, ["key"], s.componentName),
      };
    }
  });

  return nodes;
}

function groupDataByComponent(data) {
  const groupedData = new Map();
  let index = 0;
  data.forEach((span) => {
    const { componentName, spanId, parentSpanId } = span;

    if (!groupedData.has(componentName)) {
      groupedData.set(componentName, {
        spans: new Set(),
        requests: [],
        responses: [],
      });
    }

    groupedData.get(componentName).spans.add(spanId);

    if (parentSpanId) {
      const parentComponent = data.find((item) => item.spanId === parentSpanId);
      if (parentComponent) {
        const { componentName: parentComponentName } = parentComponent;
        groupedData
          .get(componentName)
          .requests.push({ to: parentComponentName, index: index++, ...span });

        if (!groupedData.has(parentComponentName)) {
          groupedData.set(parentComponentName, {
            spans: new Set(),
            requests: [],
            responses: [],
          });
        }
      }
    }
  });

  return groupedData;
}
