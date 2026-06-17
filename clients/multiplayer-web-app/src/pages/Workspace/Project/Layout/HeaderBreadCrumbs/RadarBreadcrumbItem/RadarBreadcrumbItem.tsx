import { useMemo } from "react";
import { ProjectSourceType } from "shared/models/enums";
import { useEntities } from "shared/providers/EntitiesContext";

interface RadarBreadcrumbItemProps {
  type: string;
  path: string;
  sourceType: ProjectSourceType;
}

const RadarBreadcrumbItem = ({ type, path }: RadarBreadcrumbItemProps) => {
  const { entities } = useEntities();

  const entity = useMemo(
    () => entities[type].find((entity) => entity.entityId === path),
    [entities, path]
  );

  return <>{entity?.key}</>;
};

export default RadarBreadcrumbItem;
