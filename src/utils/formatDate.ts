const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const relative = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const shortDateWithYear = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// Relative within a week ("5 minutes ago", "yesterday"), otherwise a short date ("Sep 12", "Dec 31, 2025")
export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const elapsed = now.getTime() - date.getTime()
  // Future timestamps are clock skew between client and server, not real future events
  if (elapsed < MINUTE) return 'just now'
  if (elapsed < HOUR) return relative.format(-Math.floor(elapsed / MINUTE), 'minute')
  if (elapsed < DAY) return relative.format(-Math.floor(elapsed / HOUR), 'hour')
  if (elapsed < 7 * DAY) return relative.format(-Math.floor(elapsed / DAY), 'day')

  return date.getFullYear() === now.getFullYear() ? shortDate.format(date) : shortDateWithYear.format(date)
}
