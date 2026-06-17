import { IssueRateChartPeriod } from "shared/models/enums";
import { IssueRateChartData } from "shared/models/interfaces";
import { formatIssueRateDate } from "./format";

export type IssueRateChartVariant = "inline" | "block";
export type VariantConfig = {
  container: {
    borderTop?: string;
    borderTopColor?: string;
    borderBottom?: string;
    borderBottomColor?: string;
  };
  grid: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    containLabel: boolean;
  };
  series: { color: string; barMaxWidth: number; borderRadius: number[] };
  xAxis: Partial<any>;
  yAxis: Partial<any>;
  xAxisLabelFormatter?: (
    index: number,
    items: IssueRateChartData,
    period: IssueRateChartPeriod | Date
  ) => string;
};

export const VariantConfigMap: Record<IssueRateChartVariant, VariantConfig> = {
  inline: {
    container: {
      borderTop: "1px dashed",
      borderTopColor: "border.tertiary",
      borderBottom: "1px solid",
      borderBottomColor: "border.tertiary",
    },
    grid: { left: 0, right: 0, top: 6, bottom: 0, containLabel: false },
    series: { color: "#473cfb", barMaxWidth: 10, borderRadius: [1, 1, 0, 0] },
    xAxis: { show: false },
    yAxis: { show: false },
  },
  block: {
    container: {
      borderTop: undefined,
      borderTopColor: undefined,
      borderBottom: undefined,
      borderBottomColor: undefined,
    },
    grid: { left: 0, right: 0, top: 10, bottom: 0, containLabel: true },
    series: { color: "#ef4444", barMaxWidth: 16, borderRadius: [2, 2, 0, 0] },
    xAxis: {
      show: true,
      axisLine: {
        show: false,
        lineStyle: { color: "var(--chakra-colors-border-primary)" },
      },
      axisLabel: {
        show: true,
        color: "var(--chakra-colors-muted)",
        fontSize: 12,
        margin: 20,
      },
    },
    yAxis: {
      show: true,
      splitLine: {
        show: true,
        lineStyle: { color: "var(--chakra-colors-border-primary)" },
      },
      axisLabel: {
        show: true,
        color: "var(--chakra-colors-muted)",
        fontSize: 12,
        margin: 16,
      },
    },
    xAxisLabelFormatter: (index, items, period) => {
      const item = items[0]?.series?.[index];
      if (!item) return "";
      return formatIssueRateDate(item.time, period);
    },
  },
};
