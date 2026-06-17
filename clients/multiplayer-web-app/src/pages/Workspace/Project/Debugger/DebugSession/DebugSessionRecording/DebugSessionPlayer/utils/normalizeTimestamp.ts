export const normalizeTimestamp = (timestamp: number) => {
  return Math.floor(Math.max(timestamp ?? 0, 0));
};
