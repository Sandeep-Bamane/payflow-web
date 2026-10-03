import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { apiClient } from '../../api/client'
import { useRecipientSearch } from '../useRecipientSearch'
import { createTestQueryClient, createWrapper } from '../../test/renderWithProviders'
import type { GetMock } from '../../test/mockApi'
import type { UserSummary } from '../../types/user'

vi.mock('../../api/client', () => ({ apiClient: { get: vi.fn() } }))
const get = apiClient.get as unknown as GetMock

const users: UserSummary[] = [{ id: 'u2', email: 'sandeep@example.com' }]

describe('useRecipientSearch', () => {
  it('does not search below 3 characters', async () => {
    const { result } = renderHook(() => useRecipientSearch('sa'), { wrapper: createWrapper() })

    await Promise.resolve()
    expect(result.current.fetchStatus).toBe('idle')
    expect(get).not.toHaveBeenCalled()
  })

  it("searches from 3 characters, returns the users, and caches under ['recipient-search', q]", async () => {
    get.mockResolvedValue({ data: { users } })
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useRecipientSearch('san'), { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(users)
    expect(get).toHaveBeenCalledWith('/users/search', { params: { q: 'san' } })
    expect(queryClient.getQueryData(['recipient-search', 'san'])).toEqual(users)
  })

  it('trims before checking the length and before sending', async () => {
    get.mockResolvedValue({ data: { users } })

    const { result } = renderHook(() => useRecipientSearch('  san  '), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(get).toHaveBeenCalledWith('/users/search', { params: { q: 'san' } })

    get.mockClear()
    renderHook(() => useRecipientSearch('  sa  '), { wrapper: createWrapper() })
    await Promise.resolve()
    expect(get).not.toHaveBeenCalled()
  })

  it('exposes the error when the request fails', async () => {
    get.mockRejectedValue(new Error('Network Error'))

    const { result } = renderHook(() => useRecipientSearch('san'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
