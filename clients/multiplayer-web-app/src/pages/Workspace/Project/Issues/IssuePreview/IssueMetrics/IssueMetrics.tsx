import { useCallback, useEffect, useMemo, useState } from "react";
import { MetricName } from "@multiplayer/types";
import { useParams } from "react-router-dom";
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
import { IssueRateChartPeriod } from "shared/models/enums";
import { IssueRateChartData } from "shared/models/interfaces";
import { MetricsGranularityMap } from "shared/hooks/useIssuesFilters";
import { getIssueMetrics } from "shared/services/radar.service";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useIssue } from "shared/providers/IssueContext";

const IssueMetrics = () => {
  const { issue } = useIssue();
  const { workspaceId, projectId, path: titleHashFromRoute } = useParams();
  const titleHash = issue?.titleHash ?? titleHashFromRoute;
  const [period, setPeriod] = useState<IssueRateChartPeriod>(
    IssueRateChartPeriod.DAY_30
  );
  const [data, setData] = useState<IssueRateChartData>([
    { metricName: "Events", series: [] },
    { metricName: "Sessions", series: [], color: "blue" },
  ]);

  const [loading, setLoading] = useState<boolean>(false);

  const params = useMemo(() => {
    const g = MetricsGranularityMap[period];
    return g
      ? { from: g.from(), to: g.to(), granularity: g.granularity }
      : undefined;
  }, [period]);

  const fetchMetrics = useCallback(async () => {
    if (!workspaceId || !projectId || !titleHash) return;
    try {
      setLoading(true);
      const _params = {
        ...params,
        issueTitleHash: titleHash,
        metricName: [
          MetricName.ISSUE_RATE,
          MetricName.SESSION_RECORDING_WITH_ERROR_RATE,
        ],
      };
      const res = await getIssueMetrics(workspaceId, projectId, _params);
      setData([
        { metricName: "Events", series: res[MetricName.ISSUE_RATE] || [] },
        {
          color: "blue",
          metricName: "Sessions",
          series: res[MetricName.SESSION_RECORDING_WITH_ERROR_RATE] || [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, titleHash, params]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

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
          data={data}
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

export default IssueMetrics;
