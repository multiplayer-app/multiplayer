import { Button, Icon } from "@chakra-ui/react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { SystemMapIcon } from "shared/icons";
import { EntityCategories } from "shared/models/enums";
import { useEntities } from "shared/providers/EntitiesContext";

interface SystemMapButtonProps {}

const SystemMapButton = (props: SystemMapButtonProps) => {
  const { entities } = useEntities();

  const systemMap = useMemo(() => {
    return entities[EntityCategories.PLATFORM].find((p) => p.default === true);
  }, [entities]);
  if (!systemMap) return null;

  return (
    <Button
      as={Link}
      variant="light"
      leftIcon={<Icon as={SystemMapIcon} />}
      to={`${EntityCategories.PLATFORM}/${systemMap.entityId}`}
    >
      Show System Map
    </Button>
  );
};

export default SystemMapButton;
