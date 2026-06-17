import { Box } from "@chakra-ui/react";
import { useEntities } from "shared/providers/EntitiesContext";
import GitRef from "../GitRef";

interface GitRefToolbarProps {}

const GitRefToolbar = (props: GitRefToolbarProps) => {
  const { entity } = useEntities();
  if (!entity || !entity.gitRef) return null;
  return (
    <Box
      py="2"
      px="4"
      borderBottom="solid 1px"
      borderBottomColor="border.secondary"
    >
      <GitRef gitRef={entity.gitRef} />
    </Box>
  );
};

export default GitRefToolbar;
