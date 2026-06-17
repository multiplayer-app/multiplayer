import { useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { ArrowLeftIcon, ArrowRightIcon } from "shared/icons";
import Visibility from "shared/components/Visibility";

interface TablePaginationProps {
  totalItemsCount: number;
  pageParams: { skip: number; limit: number };
  onPageChange: (skip: number) => void;
  onPageSizeChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

const TablePagination = ({
  totalItemsCount,
  pageParams,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: TablePaginationProps) => {
  const currentPage = useMemo(() => {
    const { skip, limit } = pageParams;
    return Math.floor(skip / limit) + 1;
  }, [pageParams]);

  const pageSize = pageParams.limit;
  const pagesCount = Math.ceil(totalItemsCount / pageSize);

  const handlePageChange = useCallback(
    (page: number) => {
      const skipValue = (page - 1) * pageParams.limit;
      onPageChange(skipValue);
    },
    [onPageChange, pageParams]
  );

  const renderPageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];

    if (pagesCount <= 5) {
      for (let i = 1; i <= pagesCount; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(pagesCount - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < pagesCount - 2) {
      pages.push("...");
    }

    // Always show last page
    pages.push(pagesCount);

    return pages;
  }, [currentPage, pagesCount]);

  return (
    <Flex justifyContent="space-between" alignItems="center" py={3}>
      <Flex alignItems="center" gap={2}>
        <Text textAlign="center" color="muted" fontWeight="500">
          Total: {totalItemsCount} item{totalItemsCount === 1 ? "" : "s"}
        </Text>
      </Flex>
      {pagesCount > 1 && (
        <HStack spacing={2} justify="center">
          <Button
            variant="light"
            p={1}
            size="sm"
            borderRadius={8}
            onClick={() => handlePageChange(currentPage - 1)}
            isDisabled={currentPage === 1}
          >
            <Icon as={ArrowLeftIcon} />
          </Button>
          {renderPageNumbers().map((page, index) =>
            page === "..." ? (
              <Text key={index} px={2} color="muted">
                ...
              </Text>
            ) : (
              <Button
                key={index}
                p={1}
                size="sm"
                borderRadius={8}
                variant={page === currentPage ? "solid" : "outline"}
                onClick={() => handlePageChange(page as number)}
              >
                {page}
              </Button>
            )
          )}
          <Button
            variant="light"
            p={1}
            size="sm"
            borderRadius={8}
            onClick={() => handlePageChange(currentPage + 1)}
            isDisabled={currentPage === pagesCount}
          >
            <Icon as={ArrowRightIcon} />
          </Button>
        </HStack>
      )}
      {pagesCount <= 1 && <Box />}
      {onPageSizeChange && (
        <Visibility hideBelow="md">
          <Menu>
            <MenuButton
              as={Button}
              variant="outline"
              size="sm"
              fontWeight="normal"
              borderRadius="6px"
            >
              {pageSize} / Page
            </MenuButton>
            <MenuList minW="100px">
              {pageSizeOptions.map((size) => (
                <MenuItem
                  key={size}
                  onClick={() => {
                    onPageSizeChange(size);
                    onPageChange(0);
                  }}
                >
                  {size}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Visibility>
      )}
    </Flex>
  );
};

export default TablePagination;
