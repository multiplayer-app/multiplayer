import { memo } from "react";
import { FormControl, FormLabel, Input } from "@chakra-ui/react";
import { RemoteRecordingStartCondition } from "shared/models/interfaces";

interface FormInputFieldProps {
  register: any;
  rowIndex: number;
  name: keyof RemoteRecordingStartCondition;
  label: string;
  basePath?: string;
  errors?: any;
}

const ConditionInputField = memo(
  ({
    register,
    rowIndex,
    name,
    label,
    basePath,
    errors,
  }: FormInputFieldProps) => {
    const fieldBase = basePath
      ? `${basePath}.conditions.start`
      : "conditions.start";
    const fieldName = `${fieldBase}.${rowIndex}.${name}` as const;

    const fieldError = (() => {
      if (!errors) return undefined;

      return (fieldName as string).split(".").reduce<any>((acc, segment) => {
        if (!acc) return undefined;
        const key = Number.isNaN(Number(segment)) ? segment : Number(segment);
        return acc?.[key];
      }, errors);
    })();

    return (
      <FormControl isInvalid={!!fieldError}>
        <FormLabel fontSize="sm" color="subtle" fontWeight="medium" mb={1}>
          {label}
        </FormLabel>
        <Input
          w="full"
          h="40px"
          size="sm"
          borderRadius="md"
          {...register(fieldName)}
        />
      </FormControl>
    );
  }
);

export default ConditionInputField;
