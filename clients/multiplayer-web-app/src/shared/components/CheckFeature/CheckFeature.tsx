import { forwardRef, memo, PropsWithChildren, Ref, useMemo } from "react";
import { FeatureFlag } from "@multiplayer/types";
import { Box, BoxProps } from "@chakra-ui/react";
import type { ChakraComponent } from "@chakra-ui/system";
import { usePermissions } from "shared/providers/PermissionsContext";

interface CheckFeatureProps extends PropsWithChildren {
  feature: FeatureFlag;
  fallbackElement?: React.ReactNode;
}

const CheckFeature = memo(
  ({ feature, children, fallbackElement = null }: CheckFeatureProps) => {
    const { hasFeature, featureFlags } = usePermissions();
    const memoizedHasFeature = useMemo(
      () => hasFeature(feature),
      [hasFeature, feature]
    );

    if (featureFlags.fetching) return <></>;

    return <>{memoizedHasFeature ? children : fallbackElement}</>;
  }
);

interface WidthFeatureCheckControlProps {
  feature: FeatureFlag;
  fallbackElement?: React.ReactNode;
}

type WidthFeatureCheckProps = BoxProps & WidthFeatureCheckControlProps;
type WidthFeatureCheckComponent = ChakraComponent<
  "div",
  WidthFeatureCheckControlProps
>;

const WidthFeatureCheckBase = (
  { children, feature, fallbackElement, ...props }: WidthFeatureCheckProps,
  ref: Ref<any>
) => {
  return (
    <CheckFeature feature={feature} fallbackElement={fallbackElement}>
      <Box ref={ref} {...props}>
        {children}
      </Box>
    </CheckFeature>
  );
};

export const WidthFeatureCheck = forwardRef(
  WidthFeatureCheckBase
) as WidthFeatureCheckComponent;

export default CheckFeature;
