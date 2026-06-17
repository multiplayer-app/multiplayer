import {
  Icon as ChakraIcon,
  IconProps as ChakraIconProps,
} from "@chakra-ui/react";
import type { icons as lucideIcons } from "lucide-react";
import { icons } from "lucide-react";
import { useMemo } from "react";

export interface IconProps extends ChakraIconProps {
  name?: keyof typeof lucideIcons;
  as?: React.ElementType;
}
/**
 * Unified Icon component that wraps Chakra UI's Icon and adds support for lucide-react icons.
 *
 * @example
 * // Using lucide-react icon
 * // Full list of icons: https://lucide.dev/icons/
 * <Icon name="Columns3Cog" boxSize="20px" color="blue.500" />
 *
 * @example
 * // Using Chakra's as prop (existing pattern)
 * <Icon as={PencilIcon} boxSize="16px" />
 */

export const Icon = ({ name, as, ...rest }: IconProps) => {
  const iconComponent = useMemo(() => {
    if (name && icons && icons[name as keyof typeof icons]) {
      return icons[name as keyof typeof icons];
    }
    return as;
  }, [name, as]);

  if (!iconComponent) {
    return null;
  }

  return <ChakraIcon as={iconComponent} {...rest} />;
};

export default Icon;
