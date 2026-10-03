import type { TransactionType } from '../types/transaction'

type FormatMoneyOptions = {
  // Show "+" on positive amounts too (Amount Display rule: never rely on color alone). Zero stays unsigned.
  forceSign?: boolean
}

// Money arrives from the API as an exact decimal string. Intl.NumberFormat formats the
// string as-is (no Number() conversion), so large or precise values never lose digits.
export function formatMoney(amount: string, currency: string, { forceSign = false }: FormatMoneyOptions = {}): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      signDisplay: forceSign ? 'exceptZero' : 'auto',
    }).format(amount as Intl.StringNumericLiteral)
  } catch {
    // Unknown currency code → RangeError; still show the raw value rather than crash the card
    const sign = forceSign && !amount.startsWith('-') && !isZeroAmount(amount) ? '+' : ''
    return `${sign}${amount} ${currency}`
  }
}

// The API sends positive amounts; direction comes from the transaction type, never from arithmetic
export function formatSignedMoney(amount: string, currency: string, type: TransactionType): string {
  return `${type === 'credit' ? '+' : '-'}${formatMoney(amount, currency)}`
}

// Sign read from the decimal string itself — no Number() conversion, and "-0.00" is not negative
export function isNegativeAmount(amount: string): boolean {
  return amount.trim().startsWith('-') && !isZeroAmount(amount)
}

function isZeroAmount(amount: string): boolean {
  return !/[1-9]/.test(amount)
}

// What the amount field accepts while typing: digits, at most one dot, at most 2 decimals ("12." and ".5"
// are allowed mid-typing). No sign, exponent or spaces — so there's never anything to parse or round.
export function isAmountInput(text: string): boolean {
  return /^\d*\.?\d{0,2}$/.test(text)
}

// Read from the string itself: any non-zero digit means > 0 (the input never allows a minus sign)
export function isPositiveAmount(text: string): boolean {
  return !text.trim().startsWith('-') && !isZeroAmount(text)
}
