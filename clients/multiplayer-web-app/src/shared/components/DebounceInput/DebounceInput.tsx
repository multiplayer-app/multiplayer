import { Input, InputProps } from "@chakra-ui/react";
import debounce from "lodash.debounce";
import { useState, useEffect, useMemo, ChangeEvent } from "react";

interface DebounceInputProps extends InputProps {
  trim?: boolean;
  debounceTime?: number;
  readOnly?: boolean;
}

const DebounceInput = (props: DebounceInputProps) => {
  const {
    value,
    onChange,
    trim = true,
    readOnly = false,
    debounceTime = 400,
    ...rest
  } = props;
  const [localValue, setLocalValue] = useState(value || "");

  useEffect(() => {
    setLocalValue((prev) =>
      String(prev).trim() === value ? prev : value || ""
    );
  }, [value]);

  const debouncedChangeHandler = useMemo(
    () =>
      debounce((e: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
          onChange(e);
        }
      }, debounceTime),
    [onChange, debounceTime]
  );

  useEffect(() => {
    return () => {
      debouncedChangeHandler.cancel();
    };
  }, [debouncedChangeHandler]);

  const handleLocalChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (trim) {
      const trimmedEvent = {
        ...e,
        target: {
          ...e.target,
          name: e.target.name,
          value: newValue.trim(),
        },
      } as ChangeEvent<HTMLInputElement>;
      debouncedChangeHandler(trimmedEvent);
    } else {
      debouncedChangeHandler(e);
    }
  };

  return (
    <Input
      value={localValue}
      onChange={handleLocalChange}
      readOnly={readOnly}
      {...rest}
    />
  );
};

export default DebounceInput;
