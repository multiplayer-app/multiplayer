import { IssueRateChartPeriod } from "shared/models/enums";

export const formatIssueRateDate = (
  isoTime: string,
  period: IssueRateChartPeriod | Date
): string => {
  const date = new Date(isoTime);
  const isDayGranularity = period !== IssueRateChartPeriod.HOUR_24;
  return isDayGranularity ? date.toLocaleDateString(undefined, { day: "numeric", month: "long" }) : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};
