import { Flex, Text } from "@chakra-ui/react";
import { SystemCatalogTabTypes } from "shared/models/enums";
import SystemCatalogNoDataImage from "shared/components/SystemCatalogNoDataImage";

const SystemCatalogTabComingSoon = ({
  selectedTab,
}: {
  selectedTab: SystemCatalogTabTypes;
}) => {
  return (
    <Flex
      w="full"
      h="full"
      backgroundRepeat="no-repeat"
      backgroundImage={`${process.env.PUBLIC_URL}/assets/radar-not-setup-background.svg`}
    >
      <Flex
        w="full"
        h="full"
        py="10"
        gap="8"
        direction="column"
        alignItems="center"
        background={`linear-gradient(180deg, rgba(255, 255, 255, 0.80) 65.61%, rgba(255, 255, 255, 0.79) 70.36%, rgba(255, 255, 255, 0.77) 74.22%, rgba(255, 255, 255, 0.74) 77.33%, rgba(255, 255, 255, 0.70) 79.83%, rgba(255, 255, 255, 0.65) 81.85%, rgba(255, 255, 255, 0.60) 83.54%, rgba(255, 255, 255, 0.54) 85.02%, rgba(255, 255, 255, 0.47) 86.43%, rgba(255, 255, 255, 0.40) 87.91%, rgba(255, 255, 255, 0.33) 89.6%, rgba(255, 255, 255, 0.26) 91.62%, rgba(255, 255, 255, 0.19) 94.12%, rgba(255, 255, 255, 0.12) 97.24%, rgba(255, 255, 255, 0.06) 101.1%, rgba(255, 255, 255, 0.00) 105.84%)`}
      >
        <SystemCatalogNoDataImage
          tab={selectedTab}
          props={{ alt: "empty entity", height: "220px" }}
        />
        <Flex direction="column" alignItems="center" gap="2">
          <Text align="center" fontSize="x-large" fontWeight="bold">
            {selectedTab} are coming soon!
          </Text>
          <Text maxW="450px" align="center" fontSize="sm" color="muted">
            Watch this space for updates
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SystemCatalogTabComingSoon;
