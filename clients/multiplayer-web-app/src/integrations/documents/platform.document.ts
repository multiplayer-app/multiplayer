import { Y } from "@multiplayer/entity";
import { EntityDocument } from "./entity-document";
import { Component, IEntity, ProjectLinkObjectType } from "@multiplayer/types";
import { Transaction } from "yjs";
import {
  deleteEntityLinks,
  createProjectRepoLink,
} from "shared/services/version.service";

export class PlatformDocument extends EntityDocument {
  private components: Y.Map<Component> | undefined;

  async init(entity: IEntity, timestamp: number) {
    await super.init(entity, timestamp);

    this.components = this.getMap("object").get(
      "components"
    ) as Y.Map<Component>;
    this.components.observe(this.onComponentsChange.bind(this));
  }

  async onComponentsChange(
    event: Y.YMapEvent<Component>,
    transaction: Transaction
  ) {
    if (!transaction.local) return;
    if (!this.components) return;
    try {
      const promises: Promise<void>[] = [];

      const components = Array.from(this.components?.values() || []);
      event.keys.forEach((value, key) => {
        if (value.action === "add") {
          const component = this.components?.get(key);

          const hasAnotherLink = components.some(
            ({ linkedTo, id }: Component) =>
              id !== key && linkedTo && component?.linkedTo === linkedTo
          );
          if (!hasAnotherLink) {
            promises.push(this.onNodeAdd(component));
          }
        }

        if (value.action === "delete") {
          const hasAnotherLink = components.some(
            ({ linkedTo }: Component) =>
              linkedTo && value.oldValue?.linkedTo === linkedTo
          );
          if (!hasAnotherLink) promises.push(this.onNodeDelete(value.oldValue));
        }
      });
      await Promise.all(promises);
    } catch (err) {
      this.callbacks?.onError(err);
    }
  }

  async onNodeAdd(component?: Component) {
    if (!component || !component.linkedTo || component.detectionId) return;
    await createProjectRepoLink(this.branchId, {
      sourceObject: this.entityId,
      sourceObjectType: ProjectLinkObjectType.Entity,
      targetObject: component.linkedTo,
      targetObjectType: ProjectLinkObjectType.Entity,
    });
  }

  async onNodeDelete(component?: Component) {
    if (!component || !component.linkedTo || component.detectionId) return;
    await deleteEntityLinks(this.branchId, this.entityId, component.linkedTo);
  }
}
