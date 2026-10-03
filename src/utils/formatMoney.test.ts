import { describe, expect, it } from 'vitest'
import { formatMoney, formatSignedMoney, isAmountInput, isNegativeAmount, isPositiveAmount } from './formatMoney'

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

describe('formatSignedMoney', () => {
  it('prefixes credits with +', () => {
    expect(formatSignedMoney('12.50', 'USD', 'credit')).toBe('+$12.50')
  })

  it('prefixes debits with -', () => {
    expect(formatSignedMoney('50.05', 'USD', 'debit')).toBe('-$50.05')
  })

  it('keeps grouping from formatMoney', () => {
    expect(formatSignedMoney('1234567.89', 'USD', 'debit')).toBe('-$1,234,567.89')
  })
})

describe('formatMoney with forceSign', () => {
  it('shows + on positive amounts', () => {
    expect(formatMoney('300', 'USD', { forceSign: true })).toBe('+$300.00')
  })

  it('shows - on negative amounts', () => {
    expect(formatMoney('-120', 'USD', { forceSign: true })).toBe('-$120.00')
  })

  it('shows zero without a sign, including negative zero', () => {
    expect(formatMoney('0', 'USD', { forceSign: true })).toBe('$0.00')
    expect(formatMoney('-0.00', 'USD', { forceSign: true })).toBe('$0.00')
  })

  it('leaves existing callers unchanged when the option is omitted', () => {
    expect(formatMoney('300', 'USD')).toBe('$300.00')
  })

  it('keeps full precision', () => {
    expect(formatMoney('9007199254740993.01', 'USD', { forceSign: true })).toBe('+$9,007,199,254,740,993.01')
  })

  it('keeps the + in the invalid-currency fallback', () => {
    expect(formatMoney('300', 'XX', { forceSign: true })).toBe('+300 XX')
  })
})

describe('isNegativeAmount', () => {
  it('reads the sign from the string without converting to a number', () => {
    expect(isNegativeAmount('-120')).toBe(true)
    expect(isNegativeAmount('-0.01')).toBe(true)
    expect(isNegativeAmount('120')).toBe(false)
    expect(isNegativeAmount('0')).toBe(false)
    expect(isNegativeAmount('-0')).toBe(false)
    expect(isNegativeAmount('-0.00')).toBe(false)
  })
})

describe('isAmountInput', () => {
  it('accepts partial and complete amounts with at most 2 decimals', () => {
    for (const text of ['', '12', '12.', '.5', '12.5', '12.50', '0']) expect(isAmountInput(text)).toBe(true)
  })

  it('rejects anything else', () => {
    for (const text of ['abc', '-5', '1.234', '1.2.3', '1e5', '12a', ' 12', '+5']) expect(isAmountInput(text)).toBe(false)
  })
})

describe('isPositiveAmount', () => {
  it('is true only when a non-zero digit is present', () => {
    for (const text of ['0.01', '12', '12.50', '100']) expect(isPositiveAmount(text)).toBe(true)
    for (const text of ['', '0', '0.00', '.', '0.']) expect(isPositiveAmount(text)).toBe(false)
  })
})
