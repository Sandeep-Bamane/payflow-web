// Money arrives from the API as an exact decimal string. Intl.NumberFormat formats the
// string as-is (no Number() conversion), so large or precise values never lose digits.
export function formatMoney(amount: string, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
      amount as Intl.StringNumericLiteral,
    )
  } catch {
    // Unknown currency code → RangeError; still show the raw value rather than crash the card
    return `${amount} ${currency}`
  }
}
