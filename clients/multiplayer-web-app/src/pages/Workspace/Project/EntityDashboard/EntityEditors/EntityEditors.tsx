import React, { memo, useEffect } from "react";
import { EntityType } from "@multiplayer/types";
import EntityLoading from "shared/components/EntityLoading";
import LazyContent, { lazyModule } from "shared/components/LazyContent";
import { useMultiplayerStateContext } from "shared/providers/MultiplayerStateContext";

const Code = lazyModule(() => import("../../Editors/Code"));
const Apis = lazyModule(() => import("../../Editors/Apis"));
const Schemas = lazyModule(() => import("../../Editors/Schemas"));
const Document = lazyModule(() => import("../../Editors/Document"));
const Platforms = lazyModule(() => import("../../Editors/Platforms"));
const Environments = lazyModule(() => import("../../Editors/Environments"));
const Excalidraw = lazyModule(() => import("../../Editors/ExcalidrawSketch"));
const Component = lazyModule(() => import("../../Editors/PlatformComponent"));
const VariableGroups = lazyModule(() => import("../../Editors/VariableGroups"));

const EntityEditors = memo(
  (props: {
    entityId: string;
    readonly: boolean | string;
    entityType: EntityType;
    fallbackComponent: React.ReactNode;
    isSystem?: boolean;
  }) => {
    const { entityType, readonly, fallbackComponent, isSystem } = props;
    const { doc, provider, clients } = useMultiplayerStateContext();

    useEffect(() => {
      const handleKeyDown = (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "s") {
          event.preventDefault();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, []);

    switch (entityType) {
      case EntityType.NOTEBOOK:
        return (
          <LazyContent
            fallback={<EntityLoading type={EntityType.NOTEBOOK} />}
            element={
              <Document doc={doc} readonly={!!readonly} provider={provider} />
            }
          />
        );
      case EntityType.EXCALIDRAW:
        return (
          <LazyContent
            fallback={<EntityLoading type={EntityType.EXCALIDRAW} />}
            element={
              <Excalidraw doc={doc} readonly={!!readonly} provider={provider} />
            }
          />
        );
      case EntityType.FILE:
        return (
          <LazyContent
            fallback={<EntityLoading type={EntityType.FILE} />}
            element={
              <Code doc={doc} readonly={!!readonly} provider={provider} />
            }
          />
        );
      case EntityType.PLATFORM:
        return (
          <LazyContent
            fallback={<EntityLoading type={EntityType.PLATFORM} />}
            element={
              <Platforms
                doc={doc}
                readonly={!!readonly}
                provider={provider}
                isSystemMap={isSystem}
              />
            }
          />
        );
      case EntityType.API:
        return (
          <LazyContent
            fallback={<EntityLoading type={EntityType.API} />}
            element={
              <Apis
                doc={doc}
                clients={clients}
                provider={provider}
                readonly={!!readonly}
              />
            }
          />
        );
      case EntityType.PLATFORM_COMPONENT:
        return (
          <LazyContent
            fallback={<EntityLoading type={EntityType.PLATFORM_COMPONENT} />}
            element={
              <Component
                doc={doc}
                openedIn="tab"
                clients={clients}
                provider={provider}
                readonly={!!readonly}
              />
            }
          />
        );
      case EntityType.SCHEMA:
        return <LazyContent element={<Schemas />} />;
      case EntityType.ENVIRONMENT:
        return (
          <LazyContent
            element={
              <Environments
                doc={doc}
                clients={clients}
                provider={provider}
                readonly={!!readonly}
              />
            }
          />
        );
      case EntityType.VARIABLE_GROUP:
        return (
          <LazyContent
            element={
              <VariableGroups
                doc={doc}
                provider={provider}
                readonly={!!readonly}
                clients={clients}
              />
            }
          />
        );
      default:
        return <>{fallbackComponent}</>;
    }
  }
);
export default EntityEditors;
