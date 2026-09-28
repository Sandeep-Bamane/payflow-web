import { describe, expect, it } from 'vitest'
import { formatMoney } from './formatMoney'

describe('formatMoney', () => {
  it('formats the spec example', () => {
    expect(formatMoney('1240', 'USD')).toBe('$1,240.00')
  })

  it('pads to two decimals', () => {
    expect(formatMoney('1240.5', 'USD')).toBe('$1,240.50')
    expect(formatMoney('0', 'USD')).toBe('$0.00')
  })

  it('groups thousands', () => {
    expect(formatMoney('1234567.89', 'USD')).toBe('$1,234,567.89')
  })

  it('keeps full precision beyond what a JS number can hold', () => {
    // Number('9007199254740993.01') would print ...992.00
    expect(formatMoney('9007199254740993.01', 'USD')).toBe('$9,007,199,254,740,993.01')
  })

  it('formats negative amounts', () => {
    expect(formatMoney('-25.00', 'USD')).toBe('-$25.00')
  })

  it('uses the currency from the response', () => {
    expect(formatMoney('1240', 'EUR')).toBe('€1,240.00')
  })

  it('falls back to "amount CODE" for an invalid currency code instead of throwing', () => {
    expect(formatMoney('1240', 'XX')).toBe('1240 XX')
  })
})
