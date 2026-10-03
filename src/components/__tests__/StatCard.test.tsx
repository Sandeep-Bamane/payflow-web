import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { StatCard } from '../StatCard'
import { renderWithProviders } from '../../test/renderWithProviders'
import { theme } from '../../theme'

describe('StatCard', () => {
  it('renders a body2 secondary-colored label above its value', () => {
    renderWithProviders(
      <StatCard label="Transactions">
        <span>42</span>
      </StatCard>,
    )

    const label = screen.getByText('Transactions')
    expect(label).toHaveClass('MuiTypography-body2')
    expect(getComputedStyle(label).color).toBe(theme.palette.text.secondary)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(label.closest('.MuiCard-root')).toContainElement(screen.getByText('42'))
  })
})
