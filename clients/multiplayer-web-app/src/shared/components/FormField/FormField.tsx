import { ReactNode, useEffect } from "react";
import { UseFormRegister } from "react-hook-form";
import {
  Input,
  Tooltip,
  FormLabel,
  InputGroup,
  FormControl,
  InputLeftElement,
  InputRightElement,
  FormControlProps,
  Icon,
  Spinner,
  Select,
  Text,
} from "@chakra-ui/react";
import { InfoCircleIcon } from "shared/icons";

interface FormFieldProps extends FormControlProps {
  name: string;
  type?: string;
  hint?: string;
  label?: string;
  inputProps?: any;
  isLoading?: boolean;
  placeholder?: string;
  caretPosition?: number;
  errors?: Record<string, any>;
  options?: { name: string; value: string }[];
  leftElement?: ReactNode | undefined;
  rightElement?: ReactNode | undefined;
  registerFn: UseFormRegister<any>;
}

const getFieldError = (errors: Record<string, any>, name: string) => {
  if (!errors || !name) {
    return undefined;
  }

  const pathSegments = name
    .replace(/\[(\w+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);

  return pathSegments.reduce<Record<string, any> | string | undefined>(
    (acc, segment) => {
      if (acc === undefined || acc === null) {
        return undefined;
      }

      if (typeof acc !== "object") {
        return undefined;
      }

      return acc[segment as keyof typeof acc];
    },
    errors
  );
};

const getErrorMessage = (error: unknown): ReactNode | undefined => {
  if (!error) {
    return undefined;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && "message" in error) {
    return (error as Record<string, ReactNode>).message;
  }

  return undefined;
};

const FormField = ({
  name,
  hint,
  label,
  as = "input",
  type = "text",
  errors = {},
  placeholder,
  isLoading,
  inputProps = {},
  children,
  leftElement,
  rightElement,
  options,
  registerFn,
  caretPosition,
  onBlur = (e) => {},
  onChange = (e) => {},
  ...rest
}: FormFieldProps) => {
  useEffect(() => {
    if (caretPosition && inputProps.id) {
      const input = document.getElementById(inputProps.id) as HTMLInputElement;

      if (input) {
        input.setSelectionRange(caretPosition, caretPosition);
      }
    }
  }, [caretPosition, inputProps.id]);
  const fieldError = getFieldError(errors, name);
  const errorMessage = getErrorMessage(fieldError);

  return (
    <FormControl {...rest} isInvalid={!!fieldError}>
      {!!label && <FormLabel>{label}</FormLabel>}
      <InputGroup>
        {options ? (
          <Select {...inputProps} {...registerFn(name, { onChange, onBlur })}>
            {options.map((opt) => (
              <option value={opt.value} key={opt.value}>
                {opt.name}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            type={type}
            placeholder={placeholder}
            {...inputProps}
            {...registerFn(name, { onChange, onBlur })}
          />
        )}
        {leftElement ? <InputLeftElement children={leftElement} /> : null}
        <InputRightElement
          children={
            fieldError ? (
              <Tooltip label={errorMessage as ReactNode}>
                <Icon as={InfoCircleIcon} color="red.500" />
              </Tooltip>
            ) : isLoading ? (
              <Spinner color="brand.500" />
            ) : (
              rightElement
            )
          }
        />
      </InputGroup>
      {hint && (
        <Text mt="2" color="muted" fontSize="xs">
          {hint}
        </Text>
      )}
      {children}
    </FormControl>
  );
};

export default FormField;
