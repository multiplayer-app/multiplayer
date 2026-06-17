import { Image, ImageProps } from "@chakra-ui/react";
import { SystemCatalogTabTypes } from "shared/models/enums";
import EmptyAPIs from "assets/images/emptyStates/SystemCatalog-APIs.png";
import EmptyComponents from "assets/images/emptyStates/SystemCatalog-Components.png";
import EmptyDependencies from "assets/images/emptyStates/SystemCatalog-Dependencies.png";
import EmptyPlatforms from "assets/images/emptyStates/SystemCatalog-Platforms.png";
import EmptyFlows from "assets/images/emptyStates/SystemCatalog-Flows.png";
import EmptyEnvironments from "assets/images/emptyStates/environments-empty-list.png";

const SystemCatalogNoDataImage = ({
  tab,
  props,
}: {
  tab: SystemCatalogTabTypes;
  props: ImageProps;
}) => {
  const noDataBgImage = () => {
    switch (tab) {
      case SystemCatalogTabTypes.APIs:
        return EmptyAPIs;
      case SystemCatalogTabTypes.Components:
        return EmptyComponents;
      case SystemCatalogTabTypes.Dependencies:
        return EmptyDependencies;
      case SystemCatalogTabTypes.Platforms:
        return EmptyPlatforms;
      case SystemCatalogTabTypes.Environments:
        return EmptyEnvironments;
      case SystemCatalogTabTypes.Flows:
        return EmptyFlows;
    }
  };

  return <Image src={noDataBgImage()} {...props} />;
};

export default SystemCatalogNoDataImage;
