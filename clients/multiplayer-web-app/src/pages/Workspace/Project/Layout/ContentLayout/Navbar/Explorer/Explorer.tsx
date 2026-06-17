import { memo } from "react";
import { Text } from "@chakra-ui/react";
import { EntityCategories, ProjectSourceType } from "shared/models/enums";
import LazyContent, { lazyModule } from "shared/components/LazyContent";

const Flows = lazyModule(() => import("./Flows"));
const Entities = lazyModule(() => import("./Entities"));
const Repositories = lazyModule(() => import("./Repositories"));

const Explorer = ({ selected }) => {
  switch (selected) {
    case EntityCategories.DOCUMENT:
    case EntityCategories.SKETCH:
    case EntityCategories.PLATFORM:
    case EntityCategories.COMPONENT:
    case EntityCategories.SCHEMA:
    case EntityCategories.SOURCE:
    case EntityCategories.ENVIRONMENT:
    case EntityCategories.VARIABLE_GROUP:
      return <LazyContent element={<Entities selected={selected} />} />;
    case EntityCategories.REPOSITORY:
      return <LazyContent element={<Repositories />} />;
    case ProjectSourceType.FLOWS:
      return <LazyContent element={<Flows />} />;
    default:
      return (
        <Text color="muted" my="auto" textAlign="center">
          Unknown category
        </Text>
      );
  }
};

export default memo(Explorer);
