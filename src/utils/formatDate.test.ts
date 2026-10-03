import { describe, expect, it } from 'vitest'
import { formatRelativeDate } from './formatDate'

const now = new Date('2026-09-28T12:00:00Z')
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()
const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

describe('formatRelativeDate', () => {
  it('shows "just now" under a minute, and for timestamps slightly in the future', () => {
    expect(formatRelativeDate(ago(30 * SEC), now)).toBe('just now')
    expect(formatRelativeDate(ago(-5 * MIN), now)).toBe('just now')
  })

  it('shows minutes under an hour', () => {
    expect(formatRelativeDate(ago(5 * MIN), now)).toBe('5 minutes ago')
    expect(formatRelativeDate(ago(1 * MIN), now)).toBe('1 minute ago')
  })

  it('shows hours under a day', () => {
    expect(formatRelativeDate(ago(3 * HOUR), now)).toBe('3 hours ago')
  })

  it('shows days under a week', () => {
    expect(formatRelativeDate(ago(1 * DAY), now)).toBe('yesterday')
    expect(formatRelativeDate(ago(3 * DAY), now)).toBe('3 days ago')
    expect(formatRelativeDate(ago(6.9 * DAY), now)).toBe('6 days ago')
  })

  it('shows a short date from a week onward in the same year', () => {
    expect(formatRelativeDate('2026-09-12T08:00:00Z', now)).toBe('Sep 12')
  })

  it('includes the year for dates in a previous year', () => {
    expect(formatRelativeDate('2025-12-31T08:00:00Z', now)).toBe('Dec 31, 2025')
  })

  it('returns an unparseable value unchanged', () => {
    expect(formatRelativeDate('not-a-date', now)).toBe('not-a-date')
  })
})
