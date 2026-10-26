import { forwardRef } from "react";
import CreatableReactSelect from "react-select/creatable";
import { GroupBase, Props } from "react-select";

import type { CreatableSelectOption } from "./CreatableSelect";
import { useCreatableSelectStyles } from "./useCreatableSelectStyles";

type CreatableMultiSelectProps = Props<
  CreatableSelectOption,
  true,
  GroupBase<CreatableSelectOption>
> & {
  placeholder?: string;
};

// Pick several values from the options, or type new ones
const CreatableMultiSelect = forwardRef<any, CreatableMultiSelectProps>(
  ({ placeholder = "Select or type...", ...props }, ref) => {
    const styles = useCreatableSelectStyles({ isMulti: true });

    return (
      <CreatableReactSelect
        ref={ref}
        isMulti
        styles={styles}
        placeholder={placeholder}
        // The menu renders inline: inside a Chakra modal, a menu portaled to the page body
        // could not be scrolled (the modal locks page scrolling). Pass menuPortalTarget where
        // a scroll container would clip it.
        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
        {...props}
      />
    );
  }
);

CreatableMultiSelect.displayName = "CreatableMultiSelect";

export default CreatableMultiSelect;
