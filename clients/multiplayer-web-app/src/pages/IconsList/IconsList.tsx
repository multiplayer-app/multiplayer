import { Box, Code, Flex, Grid, Icon } from "@chakra-ui/react";
import * as AllIcons from "shared/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import NavbarSearch from "shared/components/DebounceSearch";

const Icons = () => {
  const [copied, setCopied] = useTimeoutState("");
  const [query, setQuery] = useState("");
  const list = useMemo(
    () =>
      Object.keys(AllIcons).filter((i) =>
        i.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  return (
    <>
      <Box p="8">
        <NavbarSearch onSearch={setQuery} />
      </Box>
      <Grid gridTemplateColumns="repeat(4, 1fr)">
        {list.map((key) => {
          const copyText = `<Icon as={${key}} />`;
          return (
            <Flex
              px="4"
              py="2"
              gap="4"
              key={key}
              alignItems="center"
              boxShadow="0 0 0 0.5px #f0f0f0"
              cursor="pointer"
              onClick={() => {
                navigator.clipboard.writeText(copyText);
                setCopied(copyText);
              }}
              _hover={{
                bg: "bg.subtle",
              }}
            >
              <Icon boxSize="6" as={AllIcons[key]} />
              <Code fontSize="xs" bg="none">
                {copied === copyText ? "Copied!" : copyText}
              </Code>
            </Flex>
          );
        })}
      </Grid>
    </>
  );
};

const useTimeoutState = (val, debounce = 1000) => {
  const timeRef = useRef<NodeJS.Timeout>();
  const [value, setValue] = useState(val);

  useEffect(() => {
    clearTimeout(timeRef.current);
    timeRef.current = setTimeout(() => {
      setValue(val);
    }, debounce);
  }, [value, val]);

  return [value, setValue];
};

export default Icons;
