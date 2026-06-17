import { useEffect, useRef } from "react";
import { Control, useController, Path } from "react-hook-form";
import { HStack, Input, Text } from "@chakra-ui/react";

type SamplingRateInputProps<T extends Record<string, any>> = {
  control: Control<T>;
  name: Path<T>;
};

function SamplingRateInput<T extends Record<string, any>>({
  control,
  name,
}: SamplingRateInputProps<T>) {
  const {
    field: { ref, onChange, value },
  } = useController({
    name,
    control,
    defaultValue: "" as any,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    const current = inputRef.current.value;
    const desired = value == null ? "" : String(value);
    if (current !== desired) inputRef.current.value = desired;
  }, [value]);

  const sanitize = (val: string) => {
    const raw = val.replace(/[^\d.]/g, "");
    return Math.min(100, Math.max(0, parseFloat(raw) || 0));
  };

  const commitValue = (rawValue: string) => {
    const num = sanitize(rawValue);
    onChange(num);
    if (inputRef.current) inputRef.current.value = String(num);
  };

  return (
    <HStack>
      <Input
        size="xs"
        width="40px"
        borderRadius="6px"
        defaultValue={value == null ? "" : String(value)}
        ref={(el) => {
          inputRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref && "current" in ref) {
            (ref as React.MutableRefObject<HTMLInputElement | null>).current =
              el;
          }
        }}
        onBlur={(e) => {
          const raw = e.target.value.replace(/[^\d.]/g, "");
          const num = Math.min(100, Math.max(0, parseFloat(raw) || 0));
          onChange(num);
          if (inputRef.current) inputRef.current.value = String(num);
        }}
        onInput={(e) => {
          e.currentTarget.value = e.currentTarget.value.replace(/[^\d.]/g, "");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitValue(e.currentTarget.value);
          }
        }}
        textAlign="center"
        bg="input.bg"
        borderColor="input.border"
        inputMode="decimal"
      />
      <Text fontSize="xs" color="muted">
        %
      </Text>
    </HStack>
  );
}

export default SamplingRateInput;

