import { Box, BoxProps } from "@chakra-ui/react";

interface BackgroundProps extends BoxProps {
  size: number;
}

const Background = ({ size = 25, ...rest }: BackgroundProps) => {
  return (
    <Box {...rest} as="svg">
      <g>
        <pattern
          id="1"
          x="0"
          y="0"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="0"
            cy="0"
            fill="#91919a"
            r={Math.max(1, size / 25)}
          ></circle>
        </pattern>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#1)"></rect>
      </g>
    </Box>
  );
};

export default Background;
