import { useEffect, useRef, useState } from "react";
import { Input, InputProps } from "@chakra-ui/react";

import { getSlugifiedName } from "shared/utils";

interface SlugifiedInputProps extends Omit<InputProps, "onChange"> {
  onChange?: (val: string) => void;
}

let timeout;

const SlugifiedInput = ({
  value,
  onBlur,
  onChange,
  ...rest
}: SlugifiedInputProps) => {
  const inputRef = useRef<HTMLInputElement>();
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    clearTimeout(timeout);

    const caretPosition = inputRef.current.selectionStart;
    const newVal = e.target.value
      .replace(/[^-a-zA-Z0-9\s+]+/gi, "")
      .replace(/^[0-9]+/gi, "")
      .replace(/\s+/gi, "-")
      .toLowerCase();
    const slugifiedVal = getSlugifiedName(newVal);

    e.target.value = newVal;
    inputRef.current.setSelectionRange(caretPosition, caretPosition);

    setLocalValue(newVal);

    if (typeof onChange === "function") {
      onChange(slugifiedVal);
    }

    timeout = setTimeout(() => {
      setLocalValue(slugifiedVal);
    }, 800);
  };

  const handleBlur = (e) => {
    if (typeof onBlur === "function") {
      clearTimeout(timeout);
      const slugifiedVal = getSlugifiedName(e.target.value);
      e.target.value = slugifiedVal;
      setLocalValue(slugifiedVal);
      onBlur(e);
    }
  };

  return (
    <Input
      ref={inputRef}
      value={localValue}
      onBlur={handleBlur}
      onChange={handleChange}
      {...rest}
    />
  );
};

export default SlugifiedInput;
