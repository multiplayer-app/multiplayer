import { ClientState } from "shared/models/interfaces";
import { Container, DisplayObject } from "pixi.js";
import { DiagramProvider } from "../../services";

import { Cursor } from "./Cursor/Cursor";

export default class Cursors {
  clients: Map<string, ClientState> = new Map();
  cursors: Map<string, Cursor> = new Map();
  public container: Container;

  constructor() {
    this.container = new Container();
    DiagramProvider.viewport.container.on("zoomed", () => {
      this.render();
    });
  }

  update(clients: Map<string, ClientState>): void {
    this.clients = clients;
    this.render();
  }

  private render(): void {
    const scale = DiagramProvider.viewport.scaled;
    this.clients.forEach((client, clientId) => {
      const cursor = this.cursors.get(clientId);
      if (cursor) {
        cursor.update(client, scale);
      } else {
        const newCursor = new Cursor(client, scale);
        this.cursors.set(clientId, newCursor);
        this.container.addChild(
          newCursor.container as unknown as DisplayObject
        );
      }
    });

    this.cursors.forEach((cursor, key) => {
      if (!this.clients.has(key)) {
        this.cursors.delete(key);
        cursor.destroy();
      }
    });
  }
}
