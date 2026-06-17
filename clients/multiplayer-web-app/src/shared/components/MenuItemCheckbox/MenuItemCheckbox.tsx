import { Checkbox, CheckboxProps } from "@chakra-ui/react";

interface MenuItemCheckboxProps extends CheckboxProps {}

const MenuItemCheckbox = ({ children, ...rest }: MenuItemCheckboxProps) => {
  return (
    <Checkbox
      p="1.5"
      display="flex"
      autoFocus={false}
      alignItems="center"
      flexDir="row-reverse"
      colorScheme="brand"
      _hover={{ background: "bg.subtle" }}
      borderRadius="base"
      __css={{
        ".chakra-checkbox__label": {
          w: "full",
          m: 0,
        },
      }}
      {...rest}
    >
      {children}
    </Checkbox>
  );
};

export default MenuItemCheckbox;
