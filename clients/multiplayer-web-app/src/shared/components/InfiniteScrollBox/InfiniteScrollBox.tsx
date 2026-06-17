import { Box, BoxProps } from "@chakra-ui/react";
import { forwardRef } from "react";
import PageLoading from "../PageLoading";
import NextPageTrigger from "../NextPageTrigger";

interface InfiniteScrollBoxProps extends BoxProps {
  isLoading: boolean;
  isLastPage?: boolean;
  onScrollEnd: () => void;
}

const InfiniteScrollBox = forwardRef(
  (
    {
      onScrollEnd,
      isLoading,
      isLastPage,
      children,
      ...rest
    }: InfiniteScrollBoxProps,
    ref
  ) => {
    return (
      <Box overflow="auto" position="relative" ref={ref} {...rest}>
        {children}
        <NextPageTrigger onIntersect={onScrollEnd} />
        {isLoading && <PageLoading my="4" position="relative" />}
      </Box>
    );
  }
);

export default InfiniteScrollBox;
