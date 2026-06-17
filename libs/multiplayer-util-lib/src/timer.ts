export const startTimer = () => {
  const startTime = process.hrtime()

  return startTime
}

export const getDuration = (startTime) => {
  const diff = process.hrtime(startTime)
  return diff[0] * 1e3 + diff[1] * 1e-6
}
