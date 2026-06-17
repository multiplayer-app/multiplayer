import { Flex, Image, FlexProps } from "@chakra-ui/react";
import LoadingAnimation from "shared/components/LoadingAnimation";

interface PageLoadingProps extends FlexProps {
  animateLogo?: boolean;
}

const PageLoading = ({ animateLogo, ...props }: PageLoadingProps) => {
  return (
    <Flex
      inset="0"
      pos="absolute"
      color="brand.500"
      alignItems="center"
      justifyContent="center"
      bg="bg.primary"
      {...props}
    >
      {animateLogo ? (
        <Image
          w="60px"
          src={`${process.env.PUBLIC_URL}/assets/multiplayer-loader-copy.gif`}
        />
      ) : (
        <LoadingAnimation />
      )}
    </Flex>
  );
};

export default PageLoading;
