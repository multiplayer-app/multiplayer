import { useState, useEffect } from "react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Flex, Text, Icon, Grid } from "@chakra-ui/react";
import { EntityType, IEntity, ProjectLinkObjectType } from "@multiplayer/types";

import { LightningIcon } from "shared/icons";
import EntityIcon from "shared/components/EntityIcon";
import { useTabs } from "shared/providers/TabsContext";
import { getProjectRepoLinks } from "shared/services/version.service";
import Title from "../../../Title";

interface UsedInPlatformsProps {
  entityId: string;
  branchId: string;
}

const UsedInPlatforms = ({ entityId, branchId }: UsedInPlatformsProps) => {
  const { onEntityOpen } = useTabs();
  const [linkedPlatforms, setLinkedPlatforms] = useState([]);

  useEffect(() => {
    const getPlatformLinks = async () => {
      const platformLinks = await getProjectRepoLinks(branchId, {
        sourceObjectType: [ProjectLinkObjectType.Entity],
        targetObjectType: [ProjectLinkObjectType.Entity],
        sourceEntityType: [EntityType.PLATFORM],
        targetObjectId: entityId,
      });

      if (!platformLinks?.data || !platformLinks.data.length) {
        return;
      }

      const platforms = platformLinks.data.map((entityLink: any) => {
        return {
          name: entityLink.sourceObject?.key,
          id: entityLink.sourceObject?.entityId,
        };
      });

      setLinkedPlatforms(platforms);
    };
    if (entityId) {
      getPlatformLinks();
    }
  }, [entityId, branchId]);

  return (
    <Flex direction="column" pl="1px" mt="10">
      <Title icon={LightningIcon}>
        Used in {linkedPlatforms.length} platform
        {linkedPlatforms.length === 1 ? "" : "s"}
      </Title>
      {linkedPlatforms.length ? (
        <Grid
          gap="4"
          gridTemplateColumns="repeat(auto-fit, minmax(400px, 1fr))"
        >
          {linkedPlatforms.map((platform) => (
            <Flex
              key={platform.id}
              p={4}
              gap="3"
              cursor="pointer"
              border="1px solid"
              borderRadius="lg"
              alignItems="center"
              borderColor="border.primary"
              justifyContent="space-between"
              onClick={() => {
                onEntityOpen({
                  entityId: platform.id,
                  key: platform.name,
                  type: EntityType.PLATFORM,
                } as IEntity);
              }}
            >
              <EntityIcon name={EntityType.PLATFORM} marginY="4px" />
              <Text fontWeight="medium" flex="1">
                {platform.name}
              </Text>
              <Icon as={ExternalLinkIcon} w="24px" color="muted" />
            </Flex>
          ))}
        </Grid>
      ) : (
        <Flex w="full" alignItems="center" justifyContent="center">
          This component is not used in any platforms yet.
        </Flex>
      )}
    </Flex>
  );
};

export default UsedInPlatforms;
