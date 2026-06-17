import { Box, Flex } from "@chakra-ui/react";
import { memo } from "react";

const Payloads = ({ data }: { data: string[] }) => {
  if (!data.length) return null;

  return (
    <Flex gap="4" direction="column">
      {data.map((item, index) => (
        <PayloadText text={item} key={index} />
      ))}
    </Flex>
  );
};

const PayloadText = memo(({ text }: { text: string }) => {
  let parsedItem = text;
  try {
    const parsedJson = JSON.parse(text);
    parsedItem = JSON.stringify(parsedJson, null, 2).replace(/\\n/g, "\n");
  } catch (error) {
    if (text.startsWith('"') && text.endsWith('"')) {
      parsedItem = text.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  }

  return (
    <Box whiteSpace="pre-wrap" wordBreak="break-word">
      {parsedItem}
    </Box>
  );
});

export default Payloads;
