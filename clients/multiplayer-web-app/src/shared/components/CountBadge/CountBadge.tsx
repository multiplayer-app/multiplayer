import { Box } from "@chakra-ui/react";

interface CountBadgeProps {
  value: number;
  position?: "top-left" | "top-right";
}

const POSITION_MAP = {
  "top-left": {
    top: "0",
    left: "0",
    transform: "translate(-50%, -50%)",
  },
  "top-right": {
    top: "0",
    right: "0",
    transform: "translate(50%, -50%)",
  },
};

const CountBadge = ({ value, position = "top-left" }: CountBadgeProps) => {
  if (!value) return null;
  return (
    <Box
      px="1"
      minW="4"
      textAlign="center"
      bg="brand.500"
      color="white"
      fontSize="xs"
      fontWeight="medium"
      position="absolute"
      borderRadius="full"
      lineHeight="16px"
      {...POSITION_MAP[position]}
    >
      {value}
    </Box>
  );
};

export default CountBadge;
