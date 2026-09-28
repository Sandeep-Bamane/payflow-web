import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { StatusChip } from '../StatusChip'
import { renderWithProviders } from '../../test/renderWithProviders'
import { hexToRgb } from '../../test/mockApi'
import { theme } from '../../theme'

describe('StatusChip', () => {
  it.each([
    ['completed', 'Completed', theme.palette.success.light],
    ['pending', 'Pending', theme.palette.warning.light],
    ['failed', 'Failed', theme.palette.error.light],
  ] as const)('renders %s as "%s" with its palette background', (status, label, background) => {
    renderWithProviders(<StatusChip status={status} />)

    const chip = screen.getByText(label).closest('.MuiChip-root')
    expect(chip).toBeInTheDocument()
    expect(getComputedStyle(chip as Element).backgroundColor).toBe(hexToRgb(background))
  })
})
