import { forwardRef } from "react";
import CreatableReactSelect from "react-select/creatable";
import { GroupBase, Props } from "react-select";

import { useCreatableSelectStyles } from "./useCreatableSelectStyles";

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
    const styles = useCreatableSelectStyles();

    return (
      <CreatableReactSelect
        ref={ref}
        styles={styles}
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
