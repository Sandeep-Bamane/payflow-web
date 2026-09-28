import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { apiClient } from '../../api/client'
import { useStats } from '../useStats'
import { createTestQueryClient, createWrapper } from '../../test/renderWithProviders'
import type { GetMock } from '../../test/mockApi'
import type { WalletStats } from '../../types/stats'

vi.mock('../../api/client', () => ({ apiClient: { get: vi.fn() } }))
const get = apiClient.get as unknown as GetMock

const stats: WalletStats = { transactionCount: 9, monthlyNet: '-133.89' }

describe('useStats', () => {
  it('fetches GET /wallets/me/stats once and returns the response data', async () => {
    get.mockResolvedValue({ data: stats })

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(stats)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/wallets/me/stats')
  })

  it("caches the result under the ['stats'] query key", async () => {
    get.mockResolvedValue({ data: stats })
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData(['stats'])).toEqual(stats)
  })

  it('exposes the error when the request fails', async () => {
    get.mockRejectedValue(new Error('Network Error'))

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
