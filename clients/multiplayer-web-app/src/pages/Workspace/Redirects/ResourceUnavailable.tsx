import { Flex, Text, Heading, Stack, Button, Image } from "@chakra-ui/react";
import { Link } from "react-router-dom";

import NoDataImg from "assets/images/emptyStates/no-data.png";
import EmptyEnvironments from "assets/images/emptyStates/environments-empty-list.png";

const illustrationByResource = {
  project: NoDataImg,
  workspace: EmptyEnvironments,
} as const;

export type ResourceUnavailableKind = keyof typeof illustrationByResource;

type ResourceUnavailableProps = {
  title?: string;
  description?: string;
  /** Existing empty-state art from the design library */
  resource?: ResourceUnavailableKind;
};

const ResourceUnavailable = ({
  title = "Unavailable",
  description = "This workspace or project does not exist, or you do not have access to it.",
  resource = "project",
}: ResourceUnavailableProps) => {
  const illustration = illustrationByResource[resource];

  return (
    <Flex
      flex="1"
      minH="100%"
      bg="bg.primary"
      direction="column"
      alignItems="center"
      justifyContent="center"
      px="6"
      py="12"
    >
      <Stack alignItems="center" textAlign="center" spacing="8" maxW="md">
        <Image
          src={illustration}
          alt=""
          aria-hidden
          w="full"
          maxW="240px"
          mx="auto"
          objectFit="contain"
          draggable={false}
        />
        <Stack spacing="3">
          <Heading as="h2" size="md" fontWeight="semibold">
            {title}
          </Heading>
          <Text color="muted" fontSize="md" lineHeight="tall">
            {description}
          </Text>
        </Stack>
        <Button as={Link} replace to="/" variant="solid" size="md">
          Go to home
        </Button>
      </Stack>
    </Flex>
  );
};

export default ResourceUnavailable;
