import { IssueRateChartPeriod } from "shared/models/enums";
import { MetricsGranularityMap } from "shared/hooks/useIssuesFilters";
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import IssueRateChart from "shared/components/IssueRateChart";
import { ChevronDownIcon } from "@chakra-ui/icons";

const UserMetrics = ({ series, period, setPeriod }) => {
  return (
    <Flex
      gap="3"
      direction="column"
      border="1px solid"
      borderColor="border.primary"
      borderRadius="md"
      p="4"
      flex={1}
    >
      <Flex align="center" justify="space-between">
        <Menu>
          <MenuButton
            fontWeight="medium"
            as={Button}
            variant="light"
            rightIcon={<ChevronDownIcon />}
          >
            {period}
          </MenuButton>
          <MenuList minW="80px">
            {Object.keys(MetricsGranularityMap).map((p) => (
              <MenuItem
                key={p}
                onClick={() => setPeriod(p as IssueRateChartPeriod)}
              >
                {p}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Flex>

      <Box h="170px" w="full">
        <IssueRateChart
          data={series}
          period={period}
          showRate={false}
          variant="block"
          width="100%"
          height="170px"
        />
      </Box>
    </Flex>
  );
};

export default UserMetrics;
