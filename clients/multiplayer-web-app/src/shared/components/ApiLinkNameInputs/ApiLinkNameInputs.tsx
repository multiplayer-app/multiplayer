import { FormControl, FormLabel, Input, Stack } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const ApiLinkNameInputs = ({ onLinkChange }) => {
  const [link, setLink] = useState("");

  useEffect(() => {
    onLinkChange(link);
  }, [link]);

  return (
    <Stack gap={4}>
      <FormControl>
        <FormLabel color="subtle">URL</FormLabel>
        <Input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          borderRadius="12px"
        />
      </FormControl>
    </Stack>
  );
};

export default ApiLinkNameInputs;
