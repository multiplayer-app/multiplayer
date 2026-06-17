import { forwardRef } from "react";
import { Select } from "@chakra-ui/react";
import {
  CONDITION_INTERVAL_OPTIONS,
  FILTER_INTERVAL_OPTIONS,
} from "../alertRules.constants";

type IntervalSelectProps = React.ComponentProps<typeof Select>;

export const ConditionIntervalSelect = forwardRef<
  HTMLSelectElement,
  IntervalSelectProps
>((props, ref) => (
  <Select
    size="sm"
    width="auto"
    placeholder="Select interval"
    ref={ref}
    {...props}
  >
    {CONDITION_INTERVAL_OPTIONS.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </Select>
));

export const FilterIntervalSelect = forwardRef<
  HTMLSelectElement,
  IntervalSelectProps
>((props, ref) => (
  <Select
    size="sm"
    width="auto"
    placeholder="Select interval"
    ref={ref}
    {...props}
  >
    {FILTER_INTERVAL_OPTIONS.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </Select>
));
