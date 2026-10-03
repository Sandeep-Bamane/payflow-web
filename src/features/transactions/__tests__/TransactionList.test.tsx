import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { apiClient } from '../../../api/client'
import { TransactionList } from '../TransactionList'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { fail, hexToRgb, never, routeGet, type GetMock } from '../../../test/mockApi'
import { theme } from '../../../theme'
import type { Transaction } from '../../../types/transaction'
import type { Wallet } from '../../../types/wallet'

vi.mock('../../../api/client', () => ({ apiClient: { get: vi.fn() } }))
const get = apiClient.get as unknown as GetMock

const TX_URL = '/wallets/me/transactions'
const WALLET_URL = '/wallets/me'
const usd: Wallet = { id: 'w1', balance: '100', currency: 'USD' }

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    type: 'credit',
    amount: '12.50',
    status: 'completed',
    description: 'Transfer',
    counterpartyEmail: 'alice@test.com',
    createdAt: '2026-09-28T10:00:00Z',
    ...overrides,
  }
}

function page(transactions: Transaction[]) {
  return () => Promise.resolve({ transactions, hasMore: false })
}

const skeletons = (container: HTMLElement) => container.querySelectorAll('.MuiSkeleton-root')

beforeEach(() => {
  // Only Date is faked, so TanStack's timers keep running normally
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-28T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TransactionList', () => {
  it('shows 5 rectangular 80px skeletons while loading', () => {
    routeGet(get, { [TX_URL]: never, [WALLET_URL]: never })

    const { container } = renderWithProviders(<TransactionList />)

    expect(screen.getByText('Recent transactions')).toBeInTheDocument()
    const loading = skeletons(container)
    expect(loading).toHaveLength(5)
    loading.forEach((s) => {
      expect(s).toHaveClass('MuiSkeleton-rectangular')
      expect(s).toHaveStyle({ height: '80px' })
    })
    expect(screen.queryByText('Failed to load')).not.toBeInTheDocument()
  })

  it('keeps loading until the wallet currency is known', async () => {
    routeGet(get, { [TX_URL]: page([tx({})]), [WALLET_URL]: never })

    const { container } = renderWithProviders(<TransactionList />)

    await waitFor(() => expect(get).toHaveBeenCalledWith(TX_URL, { params: { limit: 5 } }))
    expect(skeletons(container)).toHaveLength(5)
    expect(screen.queryByText('alice@test.com')).not.toBeInTheDocument()
  })

  it('renders one row per transaction with email, signed amount, status and relative date', async () => {
    routeGet(get, {
      [WALLET_URL]: () => Promise.resolve(usd),
      [TX_URL]: page([
        tx({ id: 't1', type: 'credit', amount: '12.50', status: 'completed', counterpartyEmail: 'alice@test.com', createdAt: '2026-09-28T10:00:00Z' }),
        tx({ id: 't2', type: 'debit', amount: '50.05', status: 'pending', counterpartyEmail: 'bob@test.com', createdAt: '2026-09-25T12:00:00Z' }),
      ]),
    })

    const { container } = renderWithProviders(<TransactionList />)

    const rows = await screen.findAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText('alice@test.com')).toBeInTheDocument()
    expect(within(rows[0]).getByText('+$12.50')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Completed')).toBeInTheDocument()
    expect(getComputedStyle(within(rows[0]).getByText('2 hours ago')).color).toBe(theme.palette.text.secondary)
    expect(within(rows[1]).getByText('bob@test.com')).toBeInTheDocument()
    expect(within(rows[1]).getByText('-$50.05')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Pending')).toBeInTheDocument()
    expect(within(rows[1]).getByText('3 days ago')).toBeInTheDocument()
    expect(skeletons(container)).toHaveLength(0)
  })

  it('gives every row a "View insight" button without fetching any insight on render', async () => {
    routeGet(get, {
      [WALLET_URL]: () => Promise.resolve(usd),
      [TX_URL]: page([tx({ id: 't1' }), tx({ id: 't2', counterpartyEmail: 'bob@test.com' })]),
    })

    renderWithProviders(<TransactionList />)

    const rows = await screen.findAllByRole('listitem')
    for (const row of rows) expect(within(row).getByRole('button', { name: 'View insight' })).toBeInTheDocument()
    expect(get.mock.calls.map(([url]) => url).sort()).toEqual([TX_URL, WALLET_URL].sort())
  })

  it('keeps the order the API returned, without re-sorting by date', async () => {
    routeGet(get, {
      [WALLET_URL]: () => Promise.resolve(usd),
      [TX_URL]: page([
        tx({ id: 'old', counterpartyEmail: 'old@test.com', createdAt: '2026-01-01T00:00:00Z' }),
        tx({ id: 'new', counterpartyEmail: 'new@test.com', createdAt: '2026-09-28T11:00:00Z' }),
      ]),
    })

    renderWithProviders(<TransactionList />)

    const rows = await screen.findAllByRole('listitem')
    expect(within(rows[0]).getByText('old@test.com')).toBeInTheDocument()
    expect(within(rows[1]).getByText('new@test.com')).toBeInTheDocument()
  })

  it('falls back to the description, then "Unknown", when there is no counterparty email', async () => {
    routeGet(get, {
      [WALLET_URL]: () => Promise.resolve(usd),
      [TX_URL]: page([
        tx({ id: 't1', counterpartyEmail: null, description: 'Wallet top-up' }),
        tx({ id: 't2', counterpartyEmail: null, description: '' }),
      ]),
    })

    renderWithProviders(<TransactionList />)

    const rows = await screen.findAllByRole('listitem')
    expect(within(rows[0]).getByText('Wallet top-up')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Unknown')).toBeInTheDocument()
  })

  it("formats amounts in the wallet's currency", async () => {
    routeGet(get, {
      [WALLET_URL]: () => Promise.resolve({ ...usd, currency: 'EUR' }),
      [TX_URL]: page([tx({ type: 'credit', amount: '12.50' })]),
    })

    renderWithProviders(<TransactionList />)

    expect(await screen.findByText('+€12.50')).toBeInTheDocument()
  })

  it('shows the empty state for a wallet with no transactions', async () => {
    routeGet(get, { [WALLET_URL]: () => Promise.resolve(usd), [TX_URL]: page([]) })

    const { container } = renderWithProviders(<TransactionList />)

    const empty = await screen.findByText('No transactions yet — send your first transfer')
    expect(getComputedStyle(empty).color).toBe(theme.palette.text.secondary)
    expect(screen.getByText('Recent transactions')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(skeletons(container)).toHaveLength(0)
  })

  it('shows "Failed to load" in the error color when the transactions request fails', async () => {
    routeGet(get, { [WALLET_URL]: () => Promise.resolve(usd), [TX_URL]: fail })

    const { container } = renderWithProviders(<TransactionList />)

    const message = await screen.findByText('Failed to load')
    expect(getComputedStyle(message).color).toBe(hexToRgb(theme.palette.error.main))
    expect(screen.getByText('Recent transactions')).toBeInTheDocument()
    expect(skeletons(container)).toHaveLength(0)
  })

  it('shows "Failed to load" when the wallet request fails (no currency to format with)', async () => {
    routeGet(get, { [WALLET_URL]: fail, [TX_URL]: page([tx({})]) })

    renderWithProviders(<TransactionList />)

    expect(await screen.findByText('Failed to load')).toBeInTheDocument()
    expect(screen.queryByText('alice@test.com')).not.toBeInTheDocument()
  })
})
