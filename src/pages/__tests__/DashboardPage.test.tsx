import { describe, expect, it, vi, type Mock } from 'vitest'
import { screen } from '@testing-library/react'
import { apiClient } from '../../api/client'
import { DashboardPage } from '../DashboardPage'
import { renderWithProviders } from '../../test/renderWithProviders'
import type { Wallet } from '../../types/wallet'

vi.mock('../../api/client', () => ({ apiClient: { get: vi.fn() } }))
const get = apiClient.get as unknown as Mock<(url: string) => Promise<{ data: Wallet }>>

describe('DashboardPage', () => {
  it('renders the Balance card', async () => {
    get.mockResolvedValue({ data: { id: 'w1', balance: '0', currency: 'USD' } })

    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(await screen.findByText('$0.00')).toBeInTheDocument()
  })
})
