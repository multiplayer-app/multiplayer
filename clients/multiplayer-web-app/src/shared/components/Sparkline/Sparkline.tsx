import { useMemo, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";

const Sparkline = ({
  data,
  label = "",
  width = 80,
  height = 25,
  strokeColor = "#0030EB",
  labelWidth = "60px",
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const padding = 2;

  const points = useMemo(() => {
    if (!data) {
      return [];
    }
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    return data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y =
        padding +
        ((maxValue - value) / (maxValue - minValue)) * (height - 2 * padding);
      return [x, y];
    });
  }, [data, height, width]);

  const generateSmoothPath = (points) => {
    let d = `M ${points[0][0]},${points[0][1]}`;

    for (let i = 1; i < points.length - 1; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      const xc2 = (x1 + x2) / 2;
      const yc2 = (y1 + y2) / 2;

      d += ` Q ${x1},${y1} ${xc2},${yc2}`;
    }

    d += ` T ${points[points.length - 1][0]},${points[points.length - 1][1]}`;

    return d;
  };

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const index = Math.round(
      ((relativeX - padding) / (width - 2 * padding)) * (data.length - 1)
    );
    setHoveredIndex(index >= data.length ? data.length - 1 : Math.abs(index));
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    !!data && (
      <Flex alignItems="center" gap={2}>
        <Text
          fontSize="sm"
          fontWeight="500"
          color="muted"
          whiteSpace="nowrap"
          width={labelWidth}
        >
          {hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1]}
          {label}
        </Text>

        <svg
          width={width}
          height={height}
          overflow="visible"
          style={{ background: "transparent" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <path
            d={generateSmoothPath(points)}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
          />

          {hoveredIndex !== null && points[hoveredIndex] && (
            <>
              <line
                x1={points[hoveredIndex][0]}
                y1={0}
                x2={points[hoveredIndex][0]}
                y2={height}
                stroke={strokeColor}
                strokeWidth="1"
              />
              <circle
                cx={points[hoveredIndex][0]}
                cy={points[hoveredIndex][1]}
                r={2}
                fill={strokeColor}
                stroke={strokeColor}
                strokeWidth="1"
              />
            </>
          )}
        </svg>
      </Flex>
    )
  );
};

export default Sparkline;
