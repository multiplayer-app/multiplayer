import { Heading, Flex, FlexProps, IconButton, Text } from "@chakra-ui/react";
import { ReactElement } from "react";
import ComingSoon from "shared/components/ComingSoon";
import { HamburgerIcon } from "@chakra-ui/icons";
import Visibility from "shared/components/Visibility";
import { useSettingsLayout } from "shared/providers/SettingsLayoutContext";
import { CloseIcon } from "shared/icons";

interface ContentProps extends FlexProps {
  title: string;
  description?: string;
  leftAction?: ReactElement;
  contentProps?: FlexProps;
}
const Content = ({
  title,
  description,
  children,
  leftAction = null,
  contentProps = {},
  ...rest
}: ContentProps) => {
  const { isOpen, onToggle } = useSettingsLayout();

  return (
    <Flex flexDirection="column" {...rest}>
      <Flex
        py={{ base: "4", md: "6" }}
        gap="4"
        px="4"
        borderBottom="1px"
        alignItems="center"
        borderColor="border.secondary"
      >
        <Visibility showAbove="md">
          <IconButton
            variant="light"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label="Toggle Sidebar"
            onClick={onToggle}
          />
        </Visibility>
        {leftAction}
        <Heading size="sm">{title}</Heading>
      </Flex>
      <Flex
        flex="1"
        py="4"
        px="4"
        minH="0"
        alignItems="stretch"
        flexDirection="column"
        mx="auto"
        w="full"
        {...contentProps}
      >
        {description && (
          <Text fontSize="sm" color="muted" mb="4">
            {description}
          </Text>
        )}
        {children ? children : <ComingSoon />}
      </Flex>
    </Flex>
  );
};

export default Content;
