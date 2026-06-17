import { Flex, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import { RadarDetectionSource } from "@multiplayer/types";
import { DocumentedIcon, RadarIcon1, RadarIcon2 } from "shared/icons";

export const DetectionSourceLabels = {
  [RadarDetectionSource.RADAR.toString()]: "Detected",
  [RadarDetectionSource.DOCS.toString()]: "Documented",
  [RadarDetectionSource.SYNCED.toString()]: "In Sync",
};

const ComponentStatusBadge = ({ sign }) => {
  const radarBg = useColorModeValue("purple.50", "purple.900");
  const radarBorder = useColorModeValue("purple.200", "purple.700");
  const radarText = useColorModeValue("purple.600", "purple.200");

  const syncedBg = useColorModeValue("green.50", "green.900");
  const syncedBorder = useColorModeValue("green.200", "green.700");
  const syncedText = useColorModeValue("green.600", "green.200");

  switch (sign) {
    case RadarDetectionSource.RADAR.toString():
      return (
        <Flex
          px="1"
          py="0.5"
          gap="1"
          bg={radarBg}
          alignItems="center"
          border="1px solid"
          borderRadius="md"
          userSelect="none"
          borderColor={radarBorder}
        >
          <Icon as={RadarIcon1} />
          <Text fontSize="xs" color={radarText}>
            {DetectionSourceLabels[RadarDetectionSource.RADAR]}
          </Text>
        </Flex>
      );
    case RadarDetectionSource.DOCS.toString():
      return (
        <Flex
          px="1"
          py="0.5"
          gap="1"
          bg="bg.surface"
          alignItems="center"
          border="1px solid"
          borderRadius="md"
          userSelect="none"
          borderColor="border.secondary"
        >
          <Icon as={DocumentedIcon} />
          <Text fontSize="xs" color="muted">
            {DetectionSourceLabels[RadarDetectionSource.DOCS]}
          </Text>
        </Flex>
      );
    case RadarDetectionSource.SYNCED.toString():
      return (
        <Flex
          px="1"
          py="0.5"
          gap="1"
          bg={syncedBg}
          alignItems="center"
          border="1px solid"
          borderRadius="md"
          userSelect="none"
          borderColor={syncedBorder}
        >
          <Icon as={RadarIcon2} />
          <Text fontSize="xs" color={syncedText}>
            {DetectionSourceLabels[RadarDetectionSource.SYNCED]}
          </Text>
        </Flex>
      );
  }
};

export default ComponentStatusBadge;
