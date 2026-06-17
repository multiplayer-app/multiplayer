import { IssueRateChartPeriod } from "shared/models/enums";
import { IssueRateChartData } from "shared/models/interfaces";

// Helper function to create a map from existing data
function createDataMap(data: IssueRateChartData): { metricName: string, dataMap: Map<string, number> }[] {
  return data.map((item) => {
    const dataMap = new Map<string, number>();
    const series = Array.isArray(item.series) ? item.series : [];
    series.forEach((dataItem) => {
      const timeKey = new Date(dataItem.time).toISOString();
      dataMap.set(timeKey, dataItem.value);
    });
    return { metricName: item.metricName, color: item.color, dataMap };
  });
}

// Helper function to generate time periods backwards from now
function generateTimePeriods(
  count: number,
  intervalMs: number,
  roundToStart: boolean = false
): Date[] {
  const now = new Date();
  const periods: Date[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalMs);

    if (roundToStart) {
      // Align to start of day in UTC to avoid timezone shifts when using toISOString
      time.setUTCHours(0, 0, 0, 0);
    } else {
      // Align to start of hour in UTC for hourly buckets
      time.setUTCMinutes(0, 0, 0);
    }

    periods.push(time);
  }

  return periods;
}

// Helper function to create filled data from time periods
function createFilledData(
  periods: Date[],
  dataMaps: { metricName: string, color?: string, dataMap: Map<string, number> }[]
): IssueRateChartData {
  return dataMaps.map((item) => ({
    color: item.color,
    metricName: item.metricName,
    series: periods.map((time) => ({
      time: time.toISOString(),
      value: item.dataMap.get(time.toISOString()) || 0,
    })),
  }));
}

export function fillMissingTimePeriods(
  period: IssueRateChartPeriod | Date,
  data: IssueRateChartData
): IssueRateChartData {
  const dataMap = createDataMap(data);

  let periods: Date[];

  switch (period) {
    case IssueRateChartPeriod.HOUR_24:
      periods = generateTimePeriods(24, 60 * 60 * 1000, false);
      break;
    case IssueRateChartPeriod.DAY_7:
      periods = generateTimePeriods(7, 24 * 60 * 60 * 1000, true);
      break;
    case IssueRateChartPeriod.DAY_30:
      periods = generateTimePeriods(30, 24 * 60 * 60 * 1000, true);
      break;
    case IssueRateChartPeriod.DAY_90:
      periods = generateTimePeriods(90, 24 * 60 * 60 * 1000, true);
      break;
    default:
      // Custom period
      const start = new Date(period as Date);
      const diffTime = Math.abs(new Date().getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      periods = generateTimePeriods(diffDays, 24 * 60 * 60 * 1000, true);
  }
  return createFilledData(periods, dataMap);
}
