import {
  Box,
  Icon,
  Flex,
  Button,
  Collapse,
  ButtonProps,
} from "@chakra-ui/react";
import { ChevronRightIcon } from "shared/icons";

interface ExplorerItemProps extends ButtonProps {
  name: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const ExplorerItem = ({
  name,
  children,
  isExpanded,
  onToggle,
  ...rest
}: ExplorerItemProps) => {
  return (
    <Box border="none" p="1" pr="0">
      <Button
        px="3"
        w="full"
        variant="base"
        onClick={onToggle}
        _hover={{ bg: "bg.surface" }}
        justifyContent="flex-start"
        {...rest}
        rightIcon={
          <Icon
            ml="auto"
            color="muted"
            as={ChevronRightIcon}
            transition="all .2s cubic-bezier(.87, 0, .13, 1)"
            transform={`rotate(${isExpanded ? "90deg" : "0"})`}
          />
        }
      >
        <Box as="span" flex="1">
          {name}
        </Box>
      </Button>
      <Collapse in={isExpanded} unmountOnExit>
        <Box px="3" py="2" gap="2" as={Flex} direction="column">
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

export default ExplorerItem;
