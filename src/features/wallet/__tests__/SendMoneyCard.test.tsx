import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { SendMoneyCard } from '../SendMoneyCard'
import { renderWithProviders } from '../../../test/renderWithProviders'

vi.mock('../../../api/client', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }))

describe('SendMoneyCard', () => {
  it('renders the transfer form inside a "Send money" card', () => {
    renderWithProviders(<SendMoneyCard />)

    const heading = screen.getByRole('heading', { name: 'Send money' })
    const card = heading.closest('.MuiCard-root') as HTMLElement
    expect(card).toContainElement(screen.getByRole('combobox', { name: 'Recipient email' }))
    expect(card).toContainElement(screen.getByRole('textbox', { name: 'Amount' }))
    expect(card).toContainElement(screen.getByRole('button', { name: 'Send' }))
  })
})
