import {
  Flex,
  Input,
  FormLabel,
  InputProps,
  FormControl,
} from "@chakra-ui/react";
import { useState } from "react";

interface ColorInputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  inputProps?: InputProps;
}

const ColorInput = ({
  label,
  value = "",
  onChange,
  inputProps = {},
  ...rest
}: ColorInputProps) => {
  const [internalValue, setInternalValue] = useState(value);
  const colorValue = onChange ? value : internalValue;

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <FormControl {...rest}>
      {label && <FormLabel>{label}</FormLabel>}
      <Flex
        h="10"
        gap="2"
        borderRadius="md"
        border="1px solid"
        borderColor="border.secondary"
        alignItems="center"
        transition="all 200ms"
        _hover={{ borderColor: "border.tertiary" }}
        _focusWithin={{
          borderColor: "blue.500",
          boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
        }}
      >
        <Input
          w="12"
          p="0"
          type="color"
          value={colorValue}
          onChange={handleColorChange}
          {...inputProps}
        />
        <Input
          type="text"
          value={colorValue}
          onChange={handleTextChange}
          placeholder="#FFFFFF"
          variant="unstyled"
          {...inputProps}
        />
      </Flex>
    </FormControl>
  );
};

export default ColorInput;
