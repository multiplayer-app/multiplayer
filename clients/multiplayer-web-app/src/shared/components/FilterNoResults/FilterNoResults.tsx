import { Flex, Text, Button } from "@chakra-ui/react";

const FilterNoResults = ({ onDiscardFilters }) => {
  return (
    <Flex
      gap="2"
      h="420px"
      border="1px solid"
      borderRadius="lg"
      direction="column"
      alignItems="center"
      borderColor="border.primary"
      justifyContent="center"
    >
      <Text fontWeight="bold" fontSize="lg">
        There's no data to match your filters.
      </Text>
      <Text fontSize="sm" color="muted" textAlign="center">
        Please adjust your filters or use the button below to discard all of the
        filters.
      </Text>
      <Button variant="light" mt="6" onClick={onDiscardFilters}>
        Discard all filters
      </Button>
    </Flex>
  );
};

export default FilterNoResults;
