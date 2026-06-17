import { useMemo, useState } from "react";
import {
  Button,
  Divider,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { SortingArrowIcon } from "shared/icons";
import TimeAgo from "shared/components/TimeAgo";
import DebounceSearch from "shared/components/DebounceSearch";
import FilterNoResults from "shared/components/FilterNoResults";
import MarkdownRenderer from "shared/components/MarkdownRenderer";
import InfiniteScrollBox from "shared/components/InfiniteScrollBox";

interface ISorting {
  order: "asc" | "desc";
  type: "name" | "date";
}

const Releases = ({
  releases,
  isLoading,
  onScrollEnd,
}: {
  releases: any[];
  isLoading: boolean;
  onScrollEnd: () => void;
}) => {
  const [query, setQuery] = useState<string>("");
  const [sorting, setSorting] = useState<ISorting>({
    order: "desc",
    type: "date",
  });

  const filteredReleases = useMemo(() => {
    return releases
      .filter((r) => r.version.includes(query.trim()))
      .sort((a, b) => {
        if (sorting.type === "name") {
          return sorting.order === "asc"
            ? a.version.localeCompare(b.version)
            : b.version.localeCompare(a.version);
        } else {
          return sorting.order === "asc"
            ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
            : Date.parse(b.createdAt) - Date.parse(a.createdAt);
        }
      });
  }, [releases, query, sorting]);

  const onSortingChange = (propName: string, value: any) => {
    setSorting((prev) => ({ ...prev, [propName]: value }));
  };

  return (
    <Flex flexDirection="column" w="100%" py="10">
      <Flex gap="2" justifyContent="space-between">
        <Menu>
          <MenuButton
            as={Button}
            variant="light"
            rightIcon={<SortingArrowIcon height="16px" />}
          >
            Sorting
          </MenuButton>
          <MenuList>
            <MenuOptionGroup
              value={sorting.order}
              title="Order"
              type="radio"
              onChange={(value) => {
                onSortingChange("order", value);
              }}
            >
              <MenuItemOption value="asc">Ascending</MenuItemOption>
              <MenuItemOption value="desc">Descending</MenuItemOption>
            </MenuOptionGroup>
            <MenuDivider />
            <MenuOptionGroup
              value={sorting.type}
              title="Type"
              type="radio"
              onChange={(value) => {
                onSortingChange("type", value);
              }}
            >
              <MenuItemOption value="name">Name</MenuItemOption>
              <MenuItemOption value="date">Date created</MenuItemOption>
            </MenuOptionGroup>
          </MenuList>
        </Menu>
        <DebounceSearch
          onSearch={(value) => {
            setQuery(value);
          }}
          inputGroupProps={{
            margin: "0",
            padding: "0",
            maxWidth: "300px",
          }}
          inputProps={{
            placeholder: "Start searching",
          }}
        />
      </Flex>
      <InfiniteScrollBox
        mt="4"
        flex="1"
        isLoading={isLoading}
        onScrollEnd={onScrollEnd}
      >
        <Flex direction="column" w="100%" gap="4">
          {!filteredReleases.length && !query.length ? (
            <Flex
              gap="2"
              h="420px"
              border="1px solid"
              borderRadius="lg"
              alignItems="center"
              justifyContent="center"
              borderColor="border.primary"
              direction="column"
            >
              <Text fontSize="lg" fontWeight="bold">
                No data
              </Text>
              <Text fontSize="sm" color="muted">
                There are no releases available for this component.
              </Text>
            </Flex>
          ) : !filteredReleases.length ? (
            <FilterNoResults
              onDiscardFilters={() => {
                setQuery("");
              }}
            />
          ) : (
            filteredReleases.map((release) => (
              <Flex
                p="4"
                borderRadius="16px"
                border="1px solid"
                borderColor="border.primary"
                direction="column"
                key={release._id}
              >
                <Flex gap="4" alignItems="center">
                  <Text fontSize="md" fontWeight="bold">
                    {release.version}
                  </Text>
                  <Tooltip
                    openDelay={700}
                    placement="top-start"
                    label={new Date(release.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                      }
                    )}
                  >
                    <Text fontSize="sm" color="muted">
                      <TimeAgo date={release.createdAt} />
                    </Text>
                  </Tooltip>
                </Flex>
                <Divider my="4" />
                {release.releaseNotes ? (
                  <MarkdownRenderer content={release.releaseNotes} />
                ) : (
                  <Text color="muted">No release notes</Text>
                )}
              </Flex>
            ))
          )}
        </Flex>
      </InfiniteScrollBox>
    </Flex>
  );
};

export default Releases;
