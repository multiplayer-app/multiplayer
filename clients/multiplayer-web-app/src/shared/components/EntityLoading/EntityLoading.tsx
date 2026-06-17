import { Box, Image } from "@chakra-ui/react";
import { EntityType } from "@multiplayer/types";
import PlatformComponentSkeleton from "../Skeletons/PlatformComponentSkeleton";

interface EntityLoadingProps {
  type: EntityType;
}

const EntityLoading = ({ type }: EntityLoadingProps) => {
  switch (type) {
    case EntityType.PLATFORM_COMPONENT:
      return <PlatformComponentSkeleton />;
    default:
      return (
        <Box m="auto">
          <Image
            w="60px"
            src={`${process.env.PUBLIC_URL}/assets/multiplayer-loader-copy.gif`}
          />
        </Box>
      );
  }
};

export default EntityLoading;
