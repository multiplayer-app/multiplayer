import { useState, useEffect } from 'react'

const TimeAgo = ({ date }) => {
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const currentTime = new Date().getTime()
      const previousTime = new Date(date).getTime()

      const difference = currentTime - previousTime
      const seconds = Math.floor(difference / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      const months = Math.floor(days / 30)
      const years = Math.floor(months / 12)

      let timeAgoString

      if (years > 0) {
        timeAgoString = `${years} year${years > 1 ? 's' : ''} ago`
      } else if (months > 0) {
        timeAgoString = `${months} month${months > 1 ? 's' : ''} ago`
      } else if (days > 0) {
        timeAgoString = `${days} day${days > 1 ? 's' : ''} ago`
      } else if (hours > 0) {
        timeAgoString = `${hours} hour${hours > 1 ? 's' : ''} ago`
      } else if (minutes > 0) {
        timeAgoString = `${minutes} minute${minutes > 1 ? 's' : ''} ago`
        // } else if (seconds < 30) {
      } else {
        timeAgoString = `Just now`
        // timeAgoString = `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
      }

      setTimeAgo(timeAgoString)
    }
    updateTime()
    const interval = setInterval(() => updateTime, 30000)
    return () => clearInterval(interval)
  }, [date])

  return <>{timeAgo}</>
}

export default TimeAgo
