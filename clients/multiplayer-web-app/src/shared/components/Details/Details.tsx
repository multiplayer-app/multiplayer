import { Box, Flex, Icon, FlexProps } from "@chakra-ui/react";
import { ReactNode } from "react";
import { GlobeIcon } from "shared/icons";

export const DetailListHeader = ({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) => {
  return (
    <Flex color="muted">
      <Icon as={GlobeIcon} mr={2} color="brand.500" />
      <Box fontWeight="500" color="brand.500">
        {title}
      </Box>
    </Flex>
  );
};

export const DetailList = ({ children, ...rest }: FlexProps) => {
  return (
    <Flex gap="4" direction="column" {...rest}>
      {children}
    </Flex>
  );
};

export const DetailItem = ({
  label,
  value,
}: {
  label: ReactNode;
  value: ReactNode;
}) => {
  return (
    <Flex direction="column" gap="1">
      <Box
        flex="1"
        minW="200px"
        fontSize="sm"
        color="body"
        fontWeight="500"
        whiteSpace="pre-wrap"
      >
        {label}
      </Box>
      <Box flex="1" fontSize="sm" fontWeight="500" color="muted">
        {value || (
          <Flex color="muted" fontWeight="400" fontStyle="italic">
            Not available
          </Flex>
        )}
      </Box>
    </Flex>
  );
};
