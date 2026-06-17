import { forwardRef } from "react";
import { useColorMode, useToken } from "@chakra-ui/react";
import CreatableReactSelect from "react-select/creatable";
import { GroupBase, Props } from "react-select";

export type CreatableSelectOption = {
  label: string;
  value: string;
};

type CreatableSelectProps = Props<
  CreatableSelectOption,
  false,
  GroupBase<CreatableSelectOption>
> & {
  placeholder?: string;
};

const CreatableSelect = forwardRef<any, CreatableSelectProps>(
  ({ placeholder = "Select or type...", ...props }, ref) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === "dark";

    // Get Chakra UI theme colors
    const [
      borderColor,
      borderHoverColor,
      borderFocusColor,
      bgColor,
      textColor,
      placeholderColor,
      menuBg,
      menuBorder,
      hoverBg,
      selectedBg,
    ] = useToken("colors", [
      isDark ? "whiteAlpha.300" : "gray.200",
      isDark ? "whiteAlpha.400" : "gray.300",
      "brand.500",
      isDark ? "whiteAlpha.50" : "white",
      isDark ? "white" : "gray.800",
      isDark ? "whiteAlpha.400" : "gray.400",
      isDark ? "gray.800" : "white",
      isDark ? "whiteAlpha.300" : "gray.200",
      isDark ? "whiteAlpha.100" : "gray.50",
      "brand.500",
    ]);

    const customStyles = {
      control: (provided: any, state: any) => ({
        ...provided,
        minHeight: "32px",
        height: "32px",
        fontSize: "0.875rem",
        borderRadius: "0.125rem",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: state.isFocused ? borderFocusColor : borderColor,
        backgroundColor: bgColor,
        boxShadow: state.isFocused ? `0 0 0 1px ${borderFocusColor}` : "none",
        "&:hover": {
          borderColor: state.isFocused ? borderFocusColor : borderHoverColor,
        },
        cursor: "text",
        transition: "all 0.2s",
      }),
      valueContainer: (provided: any) => ({
        ...provided,
        height: "30px",
        padding: "0 0.5rem", // 8px
      }),
      input: (provided: any) => ({
        ...provided,
        margin: "0",
        padding: "0",
        color: textColor,
      }),
      indicatorSeparator: () => ({
        display: "none",
      }),
      dropdownIndicator: (provided: any, state: any) => ({
        ...provided,
        padding: "0 0.5rem",
        color: placeholderColor,
        transition: "all 0.2s",
        "&:hover": {
          color: textColor,
        },
      }),
      clearIndicator: (provided: any) => ({
        ...provided,
        padding: "0 0.5rem",
        color: placeholderColor,
        "&:hover": {
          color: textColor,
        },
      }),
      menu: (provided: any) => ({
        ...provided,
        borderRadius: "0.375rem",
        backgroundColor: menuBg,
        border: `1px solid ${menuBorder}`,
        boxShadow: isDark
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        marginTop: "0.25rem",
        zIndex: 1000,
      }),
      menuList: (provided: any) => ({
        ...provided,
        padding: "0.25rem",
        maxHeight: "200px",
      }),
      option: (provided: any, state: any) => ({
        ...provided,
        fontSize: "0.875rem",
        borderRadius: "0.25rem",
        padding: "0.5rem 0.75rem",
        backgroundColor: state.isSelected
          ? selectedBg
          : state.isFocused
          ? hoverBg
          : "transparent",
        color: state.isSelected ? "white" : textColor,
        cursor: "pointer",
        transition: "all 0.2s",
        "&:active": {
          backgroundColor: selectedBg,
        },
      }),
      placeholder: (provided: any) => ({
        ...provided,
        color: placeholderColor,
        fontSize: "0.875rem",
      }),
      singleValue: (provided: any) => ({
        ...provided,
        color: textColor,
        fontSize: "0.875rem",
      }),
      noOptionsMessage: (provided: any) => ({
        ...provided,
        color: placeholderColor,
        fontSize: "0.875rem",
        padding: "0.5rem 0.75rem",
      }),
    };

    return (
      <CreatableReactSelect
        ref={ref}
        styles={customStyles}
        placeholder={placeholder}
        isClearable
        formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
        {...props}
      />
    );
  }
);

CreatableSelect.displayName = "CreatableSelect";

export default CreatableSelect;
