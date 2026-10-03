import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { apiClient } from '../../api/client'
import { DashboardPage } from '../DashboardPage'
import { renderWithProviders } from '../../test/renderWithProviders'
import { routeGet, type GetMock } from '../../test/mockApi'

vi.mock('../../api/client', () => ({ apiClient: { get: vi.fn() } }))
const get = apiClient.get as unknown as GetMock

describe('DashboardPage', () => {
  it('renders the stat row and the recent transactions list', async () => {
    routeGet(get, {
      '/wallets/me': () => Promise.resolve({ id: 'w1', balance: '0', currency: 'USD' }),
      '/wallets/me/stats': () => Promise.resolve({ transactionCount: 0, monthlyNet: '0' }),
      '/wallets/me/transactions': () => Promise.resolve({ transactions: [], hasMore: false }),
    })

    renderWithProviders(<DashboardPage />)

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(await screen.findByText('Transactions')).toBeInTheDocument()
    expect(screen.getByText('This Month')).toBeInTheDocument()
    expect(screen.getByText('Recent transactions')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Send money' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Recipient email' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Amount' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
    expect(await screen.findByText('No transactions yet — send your first transfer')).toBeInTheDocument()
  })
})
