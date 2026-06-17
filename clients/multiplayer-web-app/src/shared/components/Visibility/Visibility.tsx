import { memo, PropsWithChildren, useMemo } from "react";
import { useBreakpointValue, ResponsiveValue } from "@chakra-ui/react";

interface VisibilityProps extends PropsWithChildren {
  visibility?: ResponsiveValue<boolean>;
  hideBelow?: string;
  showAbove?: string;
  fallbackElement?: React.ReactNode;
}

const Visibility = memo(
  ({
    children,
    visibility,
    hideBelow,
    showAbove,
    fallbackElement = null,
  }: VisibilityProps) => {
    const visibilityValue = useMemo(() => {
      if (visibility !== undefined) {
        if (typeof visibility === "boolean") {
          return { base: visibility } as const;
        }
        return visibility;
      }

      if (hideBelow) {
        return { base: false, [hideBelow]: true } as const;
      }

      if (showAbove) {
        return { base: true, [showAbove]: false } as const;
      }

      return { base: true } as const;
    }, [visibility, hideBelow, showAbove]);

    const isVisible = useVisibility(visibilityValue);

    return <>{isVisible ? children : fallbackElement}</>;
  }
);

export function useVisibility<T = any>(
  values: Partial<Record<string, T>> | Array<T | null>
) {
  return useBreakpointValue(values, { ssr: false });
}

export default Visibility;
