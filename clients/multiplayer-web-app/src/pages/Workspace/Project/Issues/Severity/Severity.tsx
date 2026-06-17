import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Box,
  Icon,
  Menu,
  Badge,
  Button,
  MenuList,
  MenuItem,
  MenuButton,
  ButtonProps,
  Portal,
} from "@chakra-ui/react";
import { IssueSeverityLevel } from "@multiplayer/types";

export const SeverityIndicator = ({ value }: { value: IssueSeverityLevel }) => {
  const _value = SEVERITY_VALUE_MAP[value] || value;
  const severityStyle = _value
    ? SEVERITY_BADGE_STYLE_MAP[_value]
    : SEVERITY_BADGE_BASE_STYLE;

  return (
    <Box
      display="flex"
      alignItems="end"
      justifyContent="space-between"
      height="16px"
      width="16px"
    >
      <Box
        width="3.5px"
        height="5px"
        bg={severityStyle.color}
        borderRadius="2px"
        opacity={severityStyle.level > 0 ? 1 : 0.3}
      />
      <Box
        width="3.5px"
        height="9px"
        bg={severityStyle.color}
        borderRadius="2px"
        opacity={severityStyle.level > 1 ? 1 : 0.3}
      />
      <Box
        width="3.5px"
        height="14px"
        bg={severityStyle.color}
        borderRadius="2px"
        opacity={severityStyle.level > 2 ? 1 : 0.3}
      />
    </Box>
  );
};

export const SeverityBadge = ({ value }: { value?: IssueSeverityLevel }) => {
  if (!value) return;
  const _value = SEVERITY_VALUE_MAP[value] || value;
  const severityStyle = SEVERITY_BADGE_STYLE_MAP[_value];

  return (
    <Badge
      border="1px solid"
      borderRadius="base"
      textTransform="capitalize"
      fontWeight="500"
      fontSize="2xs"
      lineHeight="1"
      py="1"
      {...severityStyle}
    >
      {SEVERITY_OPTIONS[_value]?.label}
    </Badge>
  );
};

export const SeverityToggle = ({
  value,
  isDisabled,
  onChange,
  buttonProps,
  showLabel = true,
}: {
  value?: IssueSeverityLevel;
  buttonProps?: ButtonProps;
  isDisabled?: boolean;
  showLabel?: boolean;
  onChange: (severity: IssueSeverityLevel) => void;
}) => {
  return (
    <Menu>
      <MenuButton
        as={Button}
        p="0"
        size="xs"
        fontSize="xs"
        variant="base"
        textTransform="capitalize"
        rightIcon={<Icon as={ChevronDownIcon} />}
        leftIcon={<Icon as={() => <SeverityIndicator value={value} />} />}
        isDisabled={isDisabled}
        {...(buttonProps || {})}
      >
        {showLabel && "Severity:"} {SEVERITY_OPTIONS[value]?.label || "not set"}
      </MenuButton>
      <Portal>
        <MenuList minW="160px" zIndex="popover">
          {Object.values(SEVERITY_OPTIONS).map((severity) => (
            <MenuItem
              gap="2"
              key={severity.value}
              textTransform="capitalize"
              onClick={() => onChange(severity.value)}
            >
              <SeverityIndicator value={severity.value} />
              {severity.label}
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </Menu>
  );
};

export const SEVERITY_BADGE_BASE_STYLE = {
  level: 0,
  bg: "#cccccc",
  color: "gray.400",
  borderColor: "blackAlpha.100",
};

export const SEVERITY_BADGE_STYLE_MAP: Record<IssueSeverityLevel, any> = {
  [IssueSeverityLevel.HIGH]: {
    level: 3,
    bg: "#FCEDEB",
    color: "red.400",
    borderColor: "blackAlpha.100",
  },
  [IssueSeverityLevel.MEDIUM]: {
    level: 2,
    bg: "#FEEBCB",
    color: "orange.400",
    borderColor: "blackAlpha.100",
  },
  [IssueSeverityLevel.LOW]: {
    level: 1,
    bg: "#E7F3ED",
    color: "green.400",
    borderColor: "blackAlpha.100",
  },
};

export const SEVERITY_OPTIONS = {
  [IssueSeverityLevel.HIGH]: { label: "High", value: IssueSeverityLevel.HIGH },
  [IssueSeverityLevel.MEDIUM]: {
    label: "Medium",
    value: IssueSeverityLevel.MEDIUM,
  },
  [IssueSeverityLevel.LOW]: { label: "Low", value: IssueSeverityLevel.LOW },
};

const SEVERITY_VALUE_MAP = {
  [IssueSeverityLevel.HIGH]: IssueSeverityLevel.HIGH,
  [IssueSeverityLevel.MEDIUM]: IssueSeverityLevel.MEDIUM,
  [IssueSeverityLevel.LOW]: IssueSeverityLevel.LOW,
  // Legacy values
  HIGH: IssueSeverityLevel.HIGH,
  MEDIUM: IssueSeverityLevel.MEDIUM,
  LOW: IssueSeverityLevel.LOW,
};
