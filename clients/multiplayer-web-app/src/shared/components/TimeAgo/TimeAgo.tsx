import { Box, Tooltip } from "@chakra-ui/react";
import { useEffect, useState, useMemo } from "react";
import { parseDate } from "shared/utils";

const getTimeAgo = (past: number) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - past) / 1000);

  const units = [
    { name: "yr", seconds: 31536000 },
    { name: "mo", seconds: 2592000 },
    { name: "d", seconds: 86400 },
    { name: "hr", seconds: 3600 },
    { name: "min", seconds: 60 },
    { name: "sec", seconds: 1 },
  ];

  for (const unit of units) {
    const value = Math.floor(diff / unit.seconds);
    if (value >= 1) {
      return `${value}${unit.name} ago`;
    }
  }

  return "Just now";
};

const TimeAgo = ({ date, showTooltip = true }) => {
  const normalizedDate = useMemo(() => {
    return typeof date === "string" ? parseDate(date) : date;
  }, [date]);

  const [timeAgo, setTimeAgo] = useState(() => getTimeAgo(normalizedDate));

  useEffect(() => {
    const updateTime = () => setTimeAgo(getTimeAgo(normalizedDate));
    updateTime();
    const interval = setInterval(updateTime, 30000); // every 30 sec
    return () => clearInterval(interval);
  }, [normalizedDate]);

  const formattedDate = useMemo(() => {
    return new Date(normalizedDate).toLocaleString();
  }, [normalizedDate]);

  return (
    <Tooltip openDelay={500} label={formattedDate} isDisabled={!showTooltip}>
      <Box as="span">{timeAgo}</Box>
    </Tooltip>
  );
};

export default TimeAgo;
