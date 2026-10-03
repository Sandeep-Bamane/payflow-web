import { describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { apiClient } from '../../../api/client'
import { StatsCards } from '../StatsCards'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { fail, hexToRgb, never, routeGet, type GetMock } from '../../../test/mockApi'
import { theme } from '../../../theme'
import type { WalletStats } from '../../../types/stats'
import type { Wallet } from '../../../types/wallet'

vi.mock('../../../api/client', () => ({ apiClient: { get: vi.fn() } }))
const get = apiClient.get as unknown as GetMock

const STATS_URL = '/wallets/me/stats'
const WALLET_URL = '/wallets/me'
const usd: Wallet = { id: 'w1', balance: '120', currency: 'USD' }
const SUCCESS = hexToRgb(theme.palette.success.main)
const ERROR = hexToRgb(theme.palette.error.main)

function respond(stats: WalletStats, wallet: Wallet = usd) {
  routeGet(get, { [STATS_URL]: () => Promise.resolve(stats), [WALLET_URL]: () => Promise.resolve(wallet) })
}

const skeletons = (container: HTMLElement) => container.querySelectorAll('.MuiSkeleton-root')

describe('StatsCards', () => {
  it('shows two skeletons while loading', () => {
    routeGet(get, { [STATS_URL]: never, [WALLET_URL]: never })

    const { container } = renderWithProviders(<StatsCards />)

    expect(skeletons(container)).toHaveLength(2)
    expect(screen.queryByText('Transactions')).not.toBeInTheDocument()
    expect(screen.queryByText('Failed to load')).not.toBeInTheDocument()
  })

  it('keeps loading until the wallet currency is known', async () => {
    routeGet(get, { [STATS_URL]: () => Promise.resolve({ transactionCount: 9, monthlyNet: '-133.89' }), [WALLET_URL]: never })

    const { container } = renderWithProviders(<StatsCards />)

    await waitFor(() => expect(get).toHaveBeenCalledWith(STATS_URL))
    expect(skeletons(container)).toHaveLength(2)
    expect(screen.queryByText('9')).not.toBeInTheDocument()
  })

  it('shows the count and a negative monthly net in the error color', async () => {
    respond({ transactionCount: 9, monthlyNet: '-133.89' })

    const { container } = renderWithProviders(<StatsCards />)

    expect(await screen.findByText('Transactions')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText('This Month')).toBeInTheDocument()
    expect(getComputedStyle(screen.getByText('-$133.89')).color).toBe(ERROR)
    expect(skeletons(container)).toHaveLength(0)
  })

  it('shows a positive monthly net with a + sign in the success color', async () => {
    respond({ transactionCount: 2, monthlyNet: '300' })

    renderWithProviders(<StatsCards />)

    expect(getComputedStyle(await screen.findByText('+$300.00')).color).toBe(SUCCESS)
  })

  it('shows a zero monthly net without a sign, in the success color', async () => {
    respond({ transactionCount: 0, monthlyNet: '0' })

    renderWithProviders(<StatsCards />)

    expect(getComputedStyle(await screen.findByText('$0.00')).color).toBe(SUCCESS)
  })

  it('shows transactionCount exactly as returned, without grouping', async () => {
    respond({ transactionCount: 1234, monthlyNet: '0' })

    renderWithProviders(<StatsCards />)

    expect(await screen.findByText('1234')).toBeInTheDocument()
  })

  it("formats the net in the wallet's currency", async () => {
    respond({ transactionCount: 1, monthlyNet: '300' }, { ...usd, currency: 'EUR' })

    renderWithProviders(<StatsCards />)

    expect(await screen.findByText('+€300.00')).toBeInTheDocument()
  })

  it('uses the stat card value typography: h5 at weight 500', async () => {
    respond({ transactionCount: 9, monthlyNet: '-133.89' })

    renderWithProviders(<StatsCards />)

    for (const value of [await screen.findByText('9'), screen.getByText('-$133.89')]) {
      expect(value.tagName).toBe('H5')
      expect(getComputedStyle(value).fontWeight).toBe('500')
    }
  })

  it('shows a single "Failed to load" in the error color when the stats request fails', async () => {
    routeGet(get, { [STATS_URL]: fail, [WALLET_URL]: () => Promise.resolve(usd) })

    const { container } = renderWithProviders(<StatsCards />)

    const messages = await screen.findAllByText('Failed to load')
    expect(messages).toHaveLength(1)
    expect(getComputedStyle(messages[0]).color).toBe(ERROR)
    expect(screen.queryByText('Transactions')).not.toBeInTheDocument()
    expect(skeletons(container)).toHaveLength(0)
  })

  it('shows "Failed to load" when the wallet request fails (no currency to format with)', async () => {
    routeGet(get, { [STATS_URL]: () => Promise.resolve({ transactionCount: 9, monthlyNet: '1' }), [WALLET_URL]: fail })

    renderWithProviders(<StatsCards />)

    expect(await screen.findByText('Failed to load')).toBeInTheDocument()
    expect(screen.queryByText('9')).not.toBeInTheDocument()
  })

  it('keeps the last values when a background refetch fails', async () => {
    respond({ transactionCount: 9, monthlyNet: '-133.89' })
    const { queryClient } = renderWithProviders(<StatsCards />)
    await screen.findByText('-$133.89')

    routeGet(get, { [STATS_URL]: fail, [WALLET_URL]: () => Promise.resolve(usd) })
    await act(() => queryClient.refetchQueries({ queryKey: ['stats'] }))

    await waitFor(() => expect(queryClient.getQueryState(['stats'])?.status).toBe('error'))
    expect(screen.getByText('-$133.89')).toBeInTheDocument()
    expect(screen.queryByText('Failed to load')).not.toBeInTheDocument()
  })

  it('places each card in a half-width (sm=6) grid cell', async () => {
    respond({ transactionCount: 9, monthlyNet: '-133.89' })

    renderWithProviders(<StatsCards />)

    for (const label of ['Transactions', 'This Month']) {
      expect((await screen.findByText(label)).closest('.MuiGrid-grid-sm-6')).toBeInTheDocument()
    }
  })
})
