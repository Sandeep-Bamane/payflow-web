import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { apiClient } from '../../api/client'
import { useTransfer } from '../useTransfer'
import { useWallet } from '../useWallet'
import { useStats } from '../useStats'
import { useTransactions } from '../useTransactions'
import { createTestQueryClient, createWrapper } from '../../test/renderWithProviders'
import type { GetMock, PostMock } from '../../test/mockApi'
import type { TransferRequest, TransferResult } from '../../types/transfer'

vi.mock('../../api/client', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }))
const get = apiClient.get as unknown as GetMock
const post = apiClient.post as unknown as PostMock<TransferRequest>

const payload: TransferRequest = { toUserId: 'u2', amount: '12.50', idempotencyKey: 'key-1' }
const result: TransferResult = { id: 't1', walletId: 'w1', type: 'debit', amount: '12.50', status: 'completed' }

const INVALIDATED = [['wallet'], ['stats'], ['transactions', 5], ['transactions', 20]]
const UNRELATED = ['recipient-search', 'ali']

// Seed the cache directly — no components or observers needed to test which keys get invalidated
function seededClient() {
  const queryClient = createTestQueryClient()
  for (const key of [...INVALIDATED, UNRELATED]) queryClient.setQueryData(key, { seeded: key.join('/') })
  return queryClient
}

describe('useTransfer', () => {
  it('posts the payload to /wallets/transfer unchanged and returns the result', async () => {
    post.mockResolvedValue({ data: result })

    const { result: hook } = renderHook(() => useTransfer(), { wrapper: createWrapper() })
    act(() => hook.current.mutate(payload))

    await waitFor(() => expect(hook.current.isSuccess).toBe(true))
    expect(post).toHaveBeenCalledWith('/wallets/transfer', payload)
    expect(hook.current.data).toEqual(result)
  })

  it('exposes the error when the request fails', async () => {
    post.mockRejectedValue(new Error('Network Error'))

    const { result: hook } = renderHook(() => useTransfer(), { wrapper: createWrapper() })
    act(() => hook.current.mutate(payload))

    await waitFor(() => expect(hook.current.isError).toBe(true))
  })
})

describe('useTransfer — cache invalidation on success', () => {
  it('invalidates wallet, stats and every transactions page, and nothing else', async () => {
    post.mockResolvedValue({ data: result })
    const queryClient = seededClient()

    const { result: hook } = renderHook(() => useTransfer(), { wrapper: createWrapper(queryClient) })
    act(() => hook.current.mutate(payload))
    await waitFor(() => expect(hook.current.isSuccess).toBe(true))

    for (const key of INVALIDATED) expect(queryClient.getQueryState(key)?.isInvalidated, key.join('/')).toBe(true)
    expect(queryClient.getQueryState(UNRELATED)?.isInvalidated).toBe(false)
  })

  it('uses the v5 object form of invalidateQueries with exactly the three keys', async () => {
    post.mockResolvedValue({ data: result })
    const queryClient = seededClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    const { result: hook } = renderHook(() => useTransfer(), { wrapper: createWrapper(queryClient) })
    act(() => hook.current.mutate(payload))
    await waitFor(() => expect(hook.current.isSuccess).toBe(true))

    expect(invalidate.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: ['wallet'] },
      { queryKey: ['transactions'] },
      { queryKey: ['stats'] },
    ])
  })

  it('never writes guessed values into the cache (no optimistic update)', async () => {
    post.mockResolvedValue({ data: result })
    const queryClient = seededClient()

    const { result: hook } = renderHook(() => useTransfer(), { wrapper: createWrapper(queryClient) })
    act(() => hook.current.mutate(payload))
    await waitFor(() => expect(hook.current.isSuccess).toBe(true))

    for (const key of [...INVALIDATED, UNRELATED]) expect(queryClient.getQueryData(key)).toEqual({ seeded: key.join('/') })
  })

  it('invalidates nothing when the transfer fails', async () => {
    post.mockRejectedValue(new Error('Network Error'))
    const queryClient = seededClient()

    const { result: hook } = renderHook(() => useTransfer(), { wrapper: createWrapper(queryClient) })
    act(() => hook.current.mutate(payload))
    await waitFor(() => expect(hook.current.isError).toBe(true))

    for (const key of [...INVALIDATED, UNRELATED]) expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)
  })
})

describe('useTransfer — mounted dashboard queries refetch', () => {
  // All three dashboard hooks mounted in ONE renderHook: live observers, like the three cards, no components
  function renderDashboardHooks() {
    return renderHook(
      () => ({ transfer: useTransfer(), wallet: useWallet(), stats: useStats(), txs: useTransactions(5) }),
      { wrapper: createWrapper() },
    )
  }

  // First GET returns "before", every later GET returns "after" (what the server says post-transfer)
  function serverBeforeAndAfter(hold?: { url: string; gate: Promise<void> }) {
    const calls: Record<string, number> = {}
    const responses: Record<string, [unknown, unknown]> = {
      '/wallets/me': [
        { id: 'w1', balance: '107.50', currency: 'USD' },
        { id: 'w1', balance: '95.00', currency: 'USD' },
      ],
      '/wallets/me/stats': [
        { transactionCount: 10, monthlyNet: '-146.39' },
        { transactionCount: 11, monthlyNet: '-158.89' },
      ],
      '/wallets/me/transactions': [
        { transactions: [], hasMore: false },
        { transactions: [{ id: 't1' }], hasMore: false },
      ],
    }
    get.mockImplementation(async (url) => {
      calls[url] = (calls[url] ?? 0) + 1
      if (calls[url] > 1 && hold?.url === url) await hold.gate
      return { data: responses[url][calls[url] > 1 ? 1 : 0] }
    })
    return calls
  }

  it('refetches wallet, stats and transactions after a successful transfer and shows the new values', async () => {
    const calls = serverBeforeAndAfter()
    post.mockResolvedValue({ data: result })

    const { result: hook } = renderDashboardHooks()
    await waitFor(() => expect(hook.current.wallet.data?.balance).toBe('107.50'))
    await waitFor(() => expect(hook.current.stats.isSuccess && hook.current.txs.isSuccess).toBe(true))

    act(() => hook.current.transfer.mutate(payload))
    await waitFor(() => expect(hook.current.transfer.isSuccess).toBe(true))

    expect(calls).toEqual({ '/wallets/me': 2, '/wallets/me/stats': 2, '/wallets/me/transactions': 2 })
    expect(hook.current.wallet.data?.balance).toBe('95.00')
    expect(hook.current.stats.data).toEqual({ transactionCount: 11, monthlyNet: '-158.89' })
    expect(hook.current.txs.data?.transactions).toHaveLength(1)
  })

  it('stays pending until the refetches finish, so the success state never shows stale numbers', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((r) => (release = r))
    serverBeforeAndAfter({ url: '/wallets/me', gate })
    post.mockResolvedValue({ data: result })

    const { result: hook } = renderDashboardHooks()
    await waitFor(() => expect(hook.current.wallet.isSuccess && hook.current.stats.isSuccess && hook.current.txs.isSuccess).toBe(true))

    act(() => hook.current.transfer.mutate(payload))
    await waitFor(() => expect(hook.current.stats.data?.transactionCount).toBe(11)) // other refetches done
    expect(hook.current.transfer.isPending).toBe(true) // wallet refetch still held

    await act(async () => release())
    await waitFor(() => expect(hook.current.transfer.isSuccess).toBe(true))
    expect(hook.current.wallet.data?.balance).toBe('95.00')
  })
})
