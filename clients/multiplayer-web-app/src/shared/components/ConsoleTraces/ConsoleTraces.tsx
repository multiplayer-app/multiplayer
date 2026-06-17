import { Box, Text } from "@chakra-ui/react";

const ConsoleTraces = ({ data }) => {
  if (!data.length) return null;
  return (
    <Box pl="4">
      {data.map((t, index) => (
        <Text key={index} whiteSpace="pre-wrap">
          {`at ${t}`}
        </Text>
      ))}
    </Box>
  );
};

export default ConsoleTraces;
