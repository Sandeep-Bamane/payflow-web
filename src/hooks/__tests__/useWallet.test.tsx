import { describe, expect, it, vi, type Mock } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { apiClient } from '../../api/client'
import { useWallet } from '../useWallet'
import { createTestQueryClient, createWrapper } from '../../test/renderWithProviders'
import type { Wallet } from '../../types/wallet'

vi.mock('../../api/client', () => ({ apiClient: { get: vi.fn() } }))
const get = apiClient.get as unknown as Mock<(url: string) => Promise<{ data: Wallet }>>

const wallet: Wallet = { id: 'w1', balance: '1240', currency: 'USD' }

describe('useWallet', () => {
  it('fetches GET /wallets/me once and returns the response data', async () => {
    get.mockResolvedValue({ data: wallet })

    const { result } = renderHook(() => useWallet(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(wallet)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/wallets/me')
  })

  it("caches the result under the ['wallet'] query key", async () => {
    get.mockResolvedValue({ data: wallet })
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useWallet(), { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData(['wallet'])).toEqual(wallet)
  })

  it('exposes the error when the request fails', async () => {
    get.mockRejectedValue(new Error('Network Error'))

    const { result } = renderHook(() => useWallet(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(new Error('Network Error'))
  })
})
