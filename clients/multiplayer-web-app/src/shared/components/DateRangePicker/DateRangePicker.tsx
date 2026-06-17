import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  InputGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  VStack,
  HStack,
  Icon,
  FormControl,
  MenuDivider,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  format,
  subHours,
  subDays,
  subWeeks,
  subMonths,
  isValid,
  parseISO,
  addDays,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "shared/icons";

export interface DateRange {
  gte?: string;
  lte?: string;
}

interface DateRangePickerComponentProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
}

const RELATIVE_OPTIONS = [
  {
    label: "Last hour",
    value: "1h",
    getRange: () => ({ gte: subHours(new Date(), 1).toISOString() }),
  },
  {
    label: "Last 24 hours",
    value: "24h",
    getRange: () => ({ gte: subHours(new Date(), 24).toISOString() }),
  },
  {
    label: "Last 7 days",
    value: "7d",
    getRange: () => ({ gte: subDays(new Date(), 7).toISOString() }),
  },
  {
    label: "Last 14 days",
    value: "14d",
    getRange: () => ({ gte: subDays(new Date(), 14).toISOString() }),
  },
  {
    label: "Last 30 days",
    value: "30d",
    getRange: () => ({ gte: subDays(new Date(), 30).toISOString() }),
  },
  {
    label: "Last 90 days",
    value: "90d",
    getRange: () => ({ gte: subDays(new Date(), 90).toISOString() }),
  },
];

const DateRangePickerComponent: React.FC<DateRangePickerComponentProps> = ({
  value,
  onChange,
  placeholder = "Select time range",
}) => {
  const [customRange, setCustomRange] = useState("");
  const [selectedRange, setSelectedRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      key: "selection",
    },
  ]);
  const [showAbsolutePicker, setShowAbsolutePicker] = useState(false);

  // Initialize selectedRange based on current value
  useEffect(() => {
    if (value?.gte && value?.lte) {
      const startDate = parseISO(value.gte);
      const endDate = parseISO(value.lte);
      if (isValid(startDate) && isValid(endDate)) {
        setSelectedRange([
          {
            startDate,
            endDate,
            key: "selection",
          },
        ]);
      }
    } else if (value?.gte && !value?.lte) {
      // For relative ranges, set current date as end date for the calendar display
      const startDate = parseISO(value.gte);
      if (isValid(startDate)) {
        setSelectedRange([
          {
            startDate,
            endDate: new Date(), // Use current date as end date for calendar display only
            key: "selection",
          },
        ]);
      }
    }
  }, [value]);

  // Parse custom range input (e.g., "2h", "4d", "8w")
  const parseCustomRange = (input: string): DateRange | null => {
    const trimmed = input.trim().toLowerCase();
    const match = trimmed.match(/^(\d+)([hdwmy])$/);

    if (!match) return null;

    const [, amount, unit] = match;
    const num = parseInt(amount, 10);

    let date: Date;
    switch (unit) {
      case "h":
        date = subHours(new Date(), num);
        break;
      case "d":
        date = subDays(new Date(), num);
        break;
      case "w":
        date = subWeeks(new Date(), num);
        break;
      case "m":
        date = subMonths(new Date(), num);
        break;
      case "y":
        date = subMonths(new Date(), num * 12);
        break;
      default:
        return null;
    }

    return { gte: date.toISOString() };
  };

  // Get display text for current value
  const getDisplayText = (): string => {
    if (!value?.gte && !value?.lte) return placeholder;

    // Check if it's a relative time range by comparing with predefined options
    // We need to check if the current value matches any of the relative options
    for (const option of RELATIVE_OPTIONS) {
      const optionRange = option.getRange();
      // Check if the dates are close enough (within 1 minute) to account for timing differences
      const currentStartDate = new Date(value.gte!);
      const optionStartDate = new Date(optionRange.gte!);
      const timeDiff = Math.abs(
        currentStartDate.getTime() - optionStartDate.getTime()
      );

      if (timeDiff < 60000) {
        // Within 1 minute
        return option.label;
      }
    }

    // Check if it's a custom range (gte only, no lte)
    if (value.gte && !value.lte) {
      const date = parseISO(value.gte);
      if (isValid(date)) {
        return `Since ${format(date, "MMM d, yyyy")}`;
      }
    }

    // For absolute date ranges
    if (value.gte && value.lte) {
      const startDate = parseISO(value.gte);
      const endDate = parseISO(value.lte);
      if (isValid(startDate) && isValid(endDate)) {
        return `${format(startDate, "MMM d")} - ${format(
          endDate,
          "MMM d, yyyy"
        )}`;
      }
    }

    return placeholder;
  };

  // Handle relative range selection
  const handleRelativeRange = (option: (typeof RELATIVE_OPTIONS)[0]) => {
    const range = option.getRange();
    onChange(range);
    setShowAbsolutePicker(false);
  };

  // Handle custom range input
  const handleCustomRange = () => {
    const range = parseCustomRange(customRange);
    if (range) {
      onChange(range);
      setCustomRange("");
      setShowAbsolutePicker(false);
    }
  };

  // Handle absolute date range selection
  const handleAbsoluteRange = (ranges: any) => {
    setSelectedRange([ranges.selection]);
  };

  // Apply absolute date range
  const applyAbsoluteRange = () => {
    if (selectedRange && selectedRange[0]) {
      const { startDate, endDate } = selectedRange[0];
      onChange({
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      });
      setShowAbsolutePicker(false);
    }
  };

  // Clear selection
  const clearSelection = () => {
    onChange({});
    setShowAbsolutePicker(false);
  };

  return (
    <Menu onClose={() => setShowAbsolutePicker(false)}>
      <MenuButton
        as={Button}
        variant="light"
        rightIcon={<ChevronDownIcon />}
        justifyContent="space-between"
      >
        {getDisplayText()}
      </MenuButton>
      <MenuList maxW="400px" zIndex="dropdown">
        <Box>
          {!showAbsolutePicker ? (
            <>
              {/* Custom Range Input */}
              <FormControl mb={3}>
                <InputGroup size="sm">
                  <Input
                    placeholder="Custom range: 2h, 4d, 8w..."
                    value={customRange}
                    borderRadius="md"
                    onChange={(e) => setCustomRange(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleCustomRange();
                      }
                    }}
                  />
                </InputGroup>
              </FormControl>

              {/* Relative Options */}
              <VStack align="stretch" spacing={0}>
                {RELATIVE_OPTIONS.map((option) => (
                  <MenuItem
                    key={option.value}
                    onClick={() => handleRelativeRange(option)}
                  >
                    {option.label}
                  </MenuItem>
                ))}

                <MenuDivider my={1} />
                <MenuItem
                  closeOnSelect={false}
                  onClick={() => setShowAbsolutePicker(true)}
                >
                  <HStack w="full" justify="space-between">
                    <Text>Absolute date</Text>
                    <Icon as={ChevronRightIcon} />
                  </HStack>
                </MenuItem>

                {/* Clear Selection */}
                {(value?.gte || value?.lte) && (
                  <>
                    <MenuDivider my={1} />
                    <MenuItem onClick={clearSelection}>
                      <Text color="red.500">Clear selection</Text>
                    </MenuItem>
                  </>
                )}
              </VStack>
            </>
          ) : (
            <>
              {/* Back Button */}

              {/* Calendar */}
              <DateRange
                months={1}
                ranges={selectedRange}
                onChange={handleAbsoluteRange}
                showSelectionPreview={true}
                moveRangeOnFirstSelection={false}
                rangeColors={["var(--chakra-colors-brand-500)"]}
                direction="horizontal"
              />
              <HStack justify="space-between">
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Icon as={ChevronLeftIcon} />}
                  onClick={() => setShowAbsolutePicker(false)}
                >
                  Back
                </Button>
                <Button
                  as={MenuItem}
                  size="sm"
                  w="auto"
                  variant="light"
                  onClick={() => applyAbsoluteRange()}
                >
                  Apply
                </Button>
              </HStack>
            </>
          )}
        </Box>
      </MenuList>
    </Menu>
  );
};

export default DateRangePickerComponent;
