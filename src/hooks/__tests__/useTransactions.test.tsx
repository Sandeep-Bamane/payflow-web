import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { apiClient } from '../../api/client'
import { useTransactions } from '../useTransactions'
import { createTestQueryClient, createWrapper } from '../../test/renderWithProviders'
import type { GetMock } from '../../test/mockApi'
import type { TransactionPage } from '../../types/transaction'

vi.mock('../../api/client', () => ({ apiClient: { get: vi.fn() } }))
const get = apiClient.get as unknown as GetMock

const page: TransactionPage = {
  transactions: [
    { id: 't1', type: 'credit', amount: '12.50', status: 'completed', description: '', counterpartyEmail: 'a@x.com', createdAt: '2026-09-28T10:00:00Z' },
  ],
  hasMore: false,
}

describe('useTransactions', () => {
  it('fetches the first 5 by default and returns the response data', async () => {
    get.mockResolvedValue({ data: page })

    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(page)
    expect(get).toHaveBeenCalledWith('/wallets/me/transactions', { params: { limit: 5 } })
  })

  it("passes a custom limit and caches under ['transactions', limit]", async () => {
    get.mockResolvedValue({ data: page })
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useTransactions(10), { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(get).toHaveBeenCalledWith('/wallets/me/transactions', { params: { limit: 10 } })
    expect(queryClient.getQueryData(['transactions', 10])).toEqual(page)
  })

  it('exposes the error when the request fails', async () => {
    get.mockRejectedValue(new Error('Network Error'))

    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
