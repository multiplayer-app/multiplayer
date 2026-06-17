import { Flex, FlexProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface ToolbarProps extends FlexProps {
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  middleContent?: ReactNode;
}
const Toolbar = ({
  leftContent,
  rightContent,
  middleContent,
  ...rest
}: ToolbarProps) => {
  return (
    <Flex
      px="4"
      gap="4"
      minH="14"
      bg="bg.surface"
      borderBottom="1px"
      alignItems="center"
      justifyContent="space-between"
      borderBottomColor="border.primary"
      className="hidden-scrollbar"
      overflowX="auto"
      {...rest}
    >
      <Flex
        flex="1"
        gap="2"
        alignItems="center"
        justifyContent="flex-start"
        minW="0"
      >
        {leftContent}
      </Flex>
      {middleContent ? (
        <Flex
          flex="1"
          gap="2"
          alignItems="center"
          justifyContent="center"
          minW="0"
        >
          {middleContent}
        </Flex>
      ) : null}
      <Flex flex="1" gap="2" alignItems="center" justifyContent="flex-end">
        {rightContent}
      </Flex>
    </Flex>
  );
};

export default Toolbar;
