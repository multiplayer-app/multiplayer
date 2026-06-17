import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Box, Flex } from "@chakra-ui/react";
import MonoText from "shared/components/MonoText";
import { IssueRateChartData } from "shared/models/interfaces";
import { IssueRateChartPeriod } from "shared/models/enums";
import { fillMissingTimePeriods } from "./fillTimePeriods";
import { IssueRateChartVariant, VariantConfigMap } from "./configs";
import { formatIssueRateDate } from "./format";
import LazyRender from "../LazyRender";

interface IssueRateChartProps {
  showRate?: boolean;
  data: IssueRateChartData;
  width?: number | string;
  height?: number | string;
  period?: IssueRateChartPeriod | Date;
  variant?: IssueRateChartVariant;
}
interface IssueRateChartComponentProps {
  showRate?: boolean;
  data: IssueRateChartData;
  period?: IssueRateChartPeriod | Date;
  variant?: IssueRateChartVariant;
}

const IssueRateChartComponent = ({
  data,
  showRate = true,
  period = IssueRateChartPeriod.DAY_7,
  variant = "inline",
}: IssueRateChartComponentProps) => {
  const cfg = VariantConfigMap[variant];
  const { options, rate } = useMemo(() => {
    const filledData = fillMissingTimePeriods(period, data);
    let maxValue = 0;
    let rate = 0;

    filledData.forEach((item) => {
      const series = Array.isArray(item.series) ? item.series : [];
      series.forEach((dataItem) => {
        maxValue = Math.max(maxValue, dataItem.value);
        rate += dataItem.value;
      });
    });

    const options = {
      animation: false,
      grid: cfg.grid,
      xAxis: {
        type: "category",
        data: filledData[0].series.map((_, index) => index),
        ...cfg.xAxis,
        axisLabel: {
          ...(cfg.xAxis?.axisLabel || {}),
          formatter: (v: number) =>
            cfg.xAxisLabelFormatter
              ? cfg.xAxisLabelFormatter(Number(v), filledData, period)
              : "",
        },
      },
      yAxis: {
        type: "value",
        ...cfg.yAxis,
        axisLabel: {
          ...(cfg.yAxis?.axisLabel || {}),
          formatter: (value: number) => `${value}`,
        },
        min: 0,
        max: getRoundedMax(maxValue),
      },
      series: [
        ...filledData.map((item, index) => ({
          name: item.metricName,
          data: item.series.map((dataItem) => ({
            value: dataItem.value,
            itemStyle: {
              color: item.color || cfg.series.color,
            },
          })),
          type: "bar",
          barWidth: "48%",
          barMaxWidth: cfg.series.barMaxWidth,
          itemStyle: { borderRadius: cfg.series.borderRadius },
          emphasis: {
            focus: "series",
          },
          ...(rate > 0 && index === 0
            ? {
                markLine: {
                  silent: true,
                  emphasis: {
                    disabled: true,
                  },
                  symbol: "none",
                  lineStyle: {
                    type: "dashed",
                    width: 1,
                    color: "#CBD5E0",
                  },
                  data: [{ yAxis: maxValue + 0.5 }],
                },
              }
            : { markLine: undefined }),
        })),
      ],
      tooltip: {
        trigger: "item",
        showDelay: 0,
        hideDelay: 0,
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const dataIndex = p?.dataIndex ?? 0;
          const seriesIndex = p?.seriesIndex ?? 0;

          const time = filledData?.[0]?.series?.[dataIndex]?.time;
          const timeString = formatIssueRateDate(time, period);

          const metric = filledData?.[seriesIndex];
          const value = metric?.series?.[dataIndex]?.value ?? 0;
          const metricName = metric?.metricName ?? p?.seriesName ?? "Value";

          return `${timeString} <br/>${metricName}: ${value}`;
        },
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "transparent",
        borderRadius: 6,
        padding: [8, 12],
        textStyle: {
          color: "#fff",
          fontSize: 12,
          fontFamily: "system-ui, -apple-system, sans-serif",
        },
        extraCssText: "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);",
      },
    };
    return { options, rate };
  }, [period, data, variant]);

  return (
    <>
      <Box
        flex="1"
        minW="0"
        h="full"
        position="relative"
        borderBottom={VariantConfigMap[variant].container.borderBottom}
        borderColor={VariantConfigMap[variant].container.borderBottomColor}
      >
        <ReactECharts
          option={options}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer: "svg" }}
        />
      </Box>
      {showRate && (
        <MonoText fontSize="10px" fontWeight="500">
          {rate}
        </MonoText>
      )}
    </>
  );
};

const getRoundedMax = (value: number): number => {
  if (value < 10) return 10;
  // const power = Math.pow(10, Math.ceil(Math.log10(value)));
  // return power;
  return undefined;
};

const IssueRateChart = ({
  data,
  period,
  width = 100,
  height = 30,
  showRate = true,
  variant = "inline",
}: IssueRateChartProps) => {
  return (
    <LazyRender
      as={Flex}
      alignItems="center"
      gap="1"
      flex="1"
      minW="0"
      w={width}
      h={height}
    >
      <IssueRateChartComponent
        data={data}
        period={period}
        showRate={showRate}
        variant={variant}
      />
    </LazyRender>
  );
};

export default IssueRateChart;
