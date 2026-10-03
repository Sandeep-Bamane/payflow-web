import { describe, expect, it, vi, type Mock } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { apiClient } from '../../../api/client'
import { WalletBalance } from '../WalletBalance'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { formatMoney } from '../../../utils/formatMoney'
import type { Wallet } from '../../../types/wallet'
import { theme } from '../../../theme'

vi.mock('../../../api/client', () => ({ apiClient: { get: vi.fn() } }))
const get = apiClient.get as unknown as Mock<(url: string) => Promise<{ data: Wallet }>>

const wallet: Wallet = { id: 'w1', balance: '1240', currency: 'USD' }

describe('WalletBalance', () => {
  it('shows the label and a skeleton while loading', () => {
    get.mockReturnValue(new Promise(() => {})) // never resolves

    const { container } = renderWithProviders(<WalletBalance />)

    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument()
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
    expect(screen.queryByText('Failed to load')).not.toBeInTheDocument()
  })

  it('shows the formatted balance on success', async () => {
    get.mockResolvedValue({ data: wallet })

    const { container } = renderWithProviders(<WalletBalance />)

    expect(await screen.findByText('$1,240.00')).toBeInTheDocument()
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeInTheDocument()
  })

  it('uses the stat card typography: body2 label, h5 value', async () => {
    get.mockResolvedValue({ data: wallet })

    renderWithProviders(<WalletBalance />)

    const value = await screen.findByText('$1,240.00')
    expect(value.tagName).toBe('H5')
    expect(getComputedStyle(value).fontWeight).toBe('500')
    expect(screen.getByText('Balance')).toHaveClass('MuiTypography-body2')
    expect(getComputedStyle(screen.getByText('Balance')).color).toBe(theme.palette.text.secondary)
  })

  it('shows "Failed to load" in the error color when the request fails', async () => {
    get.mockRejectedValue(new Error('Network Error'))

    const { container } = renderWithProviders(<WalletBalance />)

    const message = await screen.findByText('Failed to load')
    expect(getComputedStyle(message).color).toBe('rgb(211, 47, 47)') // theme.palette.error.main
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeInTheDocument()
  })

  it('keeps showing the last balance when a background refetch fails', async () => {
    get.mockResolvedValueOnce({ data: wallet })
    const { queryClient } = renderWithProviders(<WalletBalance />)
    await screen.findByText('$1,240.00')

    get.mockRejectedValueOnce(new Error('Network Error'))
    await act(() => queryClient.refetchQueries({ queryKey: ['wallet'] }))

    await waitFor(() => expect(queryClient.getQueryState(['wallet'])?.status).toBe('error'))
    expect(screen.getByText('$1,240.00')).toBeInTheDocument()
    expect(screen.queryByText('Failed to load')).not.toBeInTheDocument()
  })

  it('renders exactly what formatMoney gives for the API string (no client-side arithmetic)', async () => {
    get.mockResolvedValue({ data: { ...wallet, balance: '10.005' } })

    renderWithProviders(<WalletBalance />)

    expect(await screen.findByText(formatMoney('10.005', 'USD'))).toBeInTheDocument()
  })
})
