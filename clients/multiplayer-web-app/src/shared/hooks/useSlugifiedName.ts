import React, { useState } from "react";
import useSlugify from "shared/hooks/useSlugify";

const useSlugifiedName = (
  initialValue: string,
  onUpdate?: (val: string) => void
): {
  slugifiedName: string;
  setSlugifiedName: React.Dispatch<React.SetStateAction<string>>;
  handleSpaces: (e) => void;
  caretPosition: number;
} => {
  const [tempName, setTempName] = useState<string>(initialValue);
  const [caretPosition, setCaretPosition] = useState<number>(null);

  useSlugify(tempName, (slug: string) => {
    slug && onUpdate && onUpdate(slug);
    setTempName(slug);
  });

  const handleSpaces = (e) => {
    if (e.key.length > 1 || (e.key >= "a" && e.key <= "z")) {
      return;
    }

    e.preventDefault();

    const caretPosition = e.target.selectionStart;
    let replacedCharValue = e.key;

    if (replacedCharValue >= "A" && replacedCharValue <= "Z") {
      replacedCharValue = replacedCharValue.toLowerCase();
    } else if (replacedCharValue === " ") {
      replacedCharValue = "-";
    }

    // Disallow special characters, TODO check which chars to allow
    else if (!/^[a-z0-9\-]$/.test(replacedCharValue)) {
      replacedCharValue = "";
    }

    setCaretPosition(e.target.selectionStart + replacedCharValue.length);

    setTempName(
      (prev) =>
        prev.slice(0, caretPosition) +
        replacedCharValue +
        prev.slice(caretPosition)
    );
  };

  return {
    slugifiedName: tempName,
    setSlugifiedName: setTempName,
    handleSpaces,
    caretPosition,
  };
};

export default useSlugifiedName;
