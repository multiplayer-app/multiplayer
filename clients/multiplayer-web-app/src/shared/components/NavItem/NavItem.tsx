import { NavLink } from "react-router-dom";
import { Button, ButtonProps } from "@chakra-ui/react";

interface NavItemProps extends ButtonProps {
  to?: string;
  target?: "_self" | "_blank" | "_parent" | "_top";
  end?: boolean;
}

const NavItem = ({ children, ...rest }: NavItemProps) => {
  return (
    <Button
      w="100%"
      variant="base"
      size="sm"
      borderRadius="md"
      sx={navItemStyles}
      as={NavLink}
      {...rest}
    >
      {children}
    </Button>
  );
};

export const navItemStyles = {
  bg: "bg.surface",
  p: "0 10px 0 5px",
  color: "muted",
  borderColor: "transparent",
  justifyContent: "flex-start",
  _hover: {
    color: "subtle",
    background: "bg.subtle",
    borderColor: "bg.muted",
    svg: { visibility: "visible" },
  },
  _activeLink: {
    background: "bg.subtle",
    borderColor: "bg.muted",
    path: { stroke: "currentColor" },
    color: "brand.500",
  },
};

export default NavItem;
