import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { AmountText } from '../AmountText'
import { renderWithProviders } from '../../test/renderWithProviders'
import { hexToRgb } from '../../test/mockApi'
import { theme } from '../../theme'

describe('AmountText', () => {
  it('shows credits with a + sign in the success color', () => {
    renderWithProviders(<AmountText amount="12.50" currency="USD" type="credit" />)

    expect(getComputedStyle(screen.getByText('+$12.50')).color).toBe(hexToRgb(theme.palette.success.main))
  })

  it('shows debits with a - sign in the error color', () => {
    renderWithProviders(<AmountText amount="12.50" currency="USD" type="debit" />)

    expect(getComputedStyle(screen.getByText('-$12.50')).color).toBe(hexToRgb(theme.palette.error.main))
  })
})
