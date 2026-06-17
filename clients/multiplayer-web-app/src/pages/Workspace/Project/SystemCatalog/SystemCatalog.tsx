import { useMemo } from "react";

import { useParams } from "react-router-dom";
import { EntityCategories } from "shared/models/enums";
import LazyContent, { lazyModule } from "shared/components/LazyContent";

import SystemCatalogContent from "./SystemCatalogContent";
import { SystemCatalogProvider } from "./SystemCatalogContext";

const EntityEditor = lazyModule(
  () => import("../EntityDashboard/EntityEditor")
);
// const Flows = lazyModule(() => import("../Flows"));

const SystemCatalog = () => {
  const { type } = useParams();
  const systemCatalogContent = useMemo(() => {
    switch (type) {
      case EntityCategories.PLATFORM:
        return (
          <LazyContent
            element={<EntityEditor fallbackComponent={null} isSystem={true} />}
          />
        );
      // TODO: Add flows and others later
      // case ProjectSourceType.FLOWS:
      //   return <LazyContent element={<Flows />} />;
      default:
        return <SystemCatalogContent />;
    }
  }, [type]);

  return <SystemCatalogProvider>{systemCatalogContent}</SystemCatalogProvider>;
};

export default SystemCatalog;
