import { ReactNode, ElementType } from "react";
import { Box, Container, Flex, Icon, Image, Text } from "@chakra-ui/react";

type IntroLayoutProps = {
  icon: ElementType;
  title: string;
  description: ReactNode;
  screenshotSrc?: string;
  screenshotMaxW?: string | number;
  screenshotAspectRatio?: string;
  children?: ReactNode;
  backgroundImage?: string;
  screenshotMargin?: string | number;
};

const IntroLayout = ({
  icon,
  title,
  description,
  screenshotSrc,
  screenshotMaxW = "980px",
  screenshotAspectRatio,
  children,
  backgroundImage = `${process.env.PUBLIC_URL}/assets/radar-intro-background.svg`,
  screenshotMargin = "12",
}: IntroLayoutProps) => {
  const backgroundProps = {
    position: "relative" as const,
    _before: {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundRepeat: "repeat-x",
      backgroundImage: `url(${backgroundImage})`,
    },
  };

  return (
    <Box p={8} py="68px" flex="1" overflow="auto" {...backgroundProps}>
      <Container maxW="1232px" position="relative">
        <Flex direction="column" alignItems="center">
          <Box
            width="108px"
            height="108px"
            borderRadius="50%"
            backgroundColor="bg.primary"
            p={4}
            boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.10), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          >
            <Icon as={icon} boxSize="76px" />
          </Box>

          <Text mt={8} align="center" fontWeight="bold" fontSize="x-large">
            {title}
          </Text>
          <Text
            mt="12px"
            maxW="630px"
            fontSize="sm"
            align="center"
            color="muted"
          >
            {description}
          </Text>

          {children && (
            <Flex gap={4} alignItems="center" mt={8}>
              {children}
            </Flex>
          )}
        </Flex>

        {screenshotSrc && (
          <Box
            mx="auto"
            mt={screenshotMargin}
            maxW={screenshotMaxW}
            w="full"
            textAlign="center"
            {...(screenshotAspectRatio
              ? { aspectRatio: screenshotAspectRatio }
              : {})}
          >
            <Image
              src={screenshotSrc}
              h="auto"
              minW="0"
              maxW={screenshotMaxW}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default IntroLayout;
