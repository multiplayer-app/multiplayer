import { Flex, Stack, Text, Image, FlexProps } from "@chakra-ui/react";

interface NoDataPageProps {
  imageSrc?: string;
  message?: string;
  props?: FlexProps;
}

const NoDataPage = ({
  imageSrc,
  message = "No data available.",
  props = {},
}: NoDataPageProps) => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    textAlign="center"
    color="muted"
    p={6}
    {...props}
  >
    <Stack spacing={4} align="center">
      {imageSrc && (
        <Image
          src={imageSrc}
          alt="No data"
          boxSize="120px"
          objectFit="contain"
        />
      )}
      <Text fontSize="sm">{message}</Text>
    </Stack>
  </Flex>
);

export default NoDataPage;
