import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import Cookies from 'js-cookie'
import { io } from 'socket.io-client'
import type { QueryClient } from '@tanstack/react-query'
import { useSocket } from '../useSocket'
import { AuthContext, type AuthContextType } from '../../context/authContext'
import { createTestQueryClient, createWrapper } from '../../test/renderWithProviders'

vi.mock('socket.io-client', () => ({ io: vi.fn() }))

type Handler = (payload?: unknown) => void
type AuthOption = (cb: (data: object) => void) => void

let handlers: Record<string, Handler>
let fakeSocket: { on: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }

const INVALIDATED = [['wallet'], ['stats'], ['transactions', 5], ['transactions', 20]]
const UNRELATED = ['recipient-search', 'ali']

function seededClient() {
  const queryClient = createTestQueryClient()
  for (const key of [...INVALIDATED, UNRELATED]) queryClient.setQueryData(key, { seeded: key.join('/') })
  return queryClient
}

// userId is read on every render, so rerender() after changing it simulates login/logout
let currentUserId: string | undefined
function renderUseSocket(queryClient: QueryClient = createTestQueryClient()) {
  const Providers = createWrapper(queryClient)
  function Wrapper({ children }: { children: ReactNode }) {
    const auth: AuthContextType = { userId: currentUserId, email: undefined, login: vi.fn(), register: vi.fn(), logout: vi.fn() }
    return (
      <Providers>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </Providers>
    )
  }
  return renderHook(() => useSocket(), { wrapper: Wrapper })
}

function ioCall() {
  const [url, options] = vi.mocked(io).mock.calls[0] as unknown as [string, { auth: AuthOption }]
  return { url, options }
}

beforeEach(() => {
  handlers = {}
  fakeSocket = {
    on: vi.fn((event: string, handler: Handler) => {
      handlers[event] = handler
      return fakeSocket
    }),
    disconnect: vi.fn(),
  }
  vi.mocked(io).mockReset().mockReturnValue(fakeSocket as never)
  currentUserId = 'u1'
  Cookies.set('ACCEESS_TOKEN', 'jwt-abc')
})

afterEach(() => {
  Cookies.remove('ACCEESS_TOKEN')
})

describe('useSocket — connection', () => {
  it('connects once to the API origin (not the /api path, which socket.io would treat as a namespace)', () => {
    renderUseSocket()

    expect(io).toHaveBeenCalledTimes(1)
    const { url } = ioCall()
    expect(url).toBe(new URL(import.meta.env.VITE_API_URL).origin)
    expect(new URL(url).pathname).toBe('/')
  })

  it('sends the same access token apiClient uses in the auth payload, re-read on every (re)connect', () => {
    renderUseSocket()
    const { options } = ioCall()

    const first = vi.fn()
    options.auth(first)
    expect(first).toHaveBeenCalledWith({ token: 'jwt-abc' })

    // After a refresh rotates the cookie, a reconnect must send the new token, not the one from mount time
    Cookies.set('ACCEESS_TOKEN', 'jwt-rotated')
    const second = vi.fn()
    options.auth(second)
    expect(second).toHaveBeenCalledWith({ token: 'jwt-rotated' })
  })

  it('does not connect when nobody is logged in', () => {
    currentUserId = undefined
    renderUseSocket()

    expect(io).not.toHaveBeenCalled()
  })

  it('does not reconnect on re-render while the same user stays logged in', () => {
    const { rerender } = renderUseSocket()
    rerender()
    rerender()

    expect(io).toHaveBeenCalledTimes(1)
  })
})

describe('useSocket — balance:updated', () => {
  it('invalidates wallet, stats and every transactions page, and nothing else', async () => {
    const queryClient = seededClient()
    renderUseSocket(queryClient)

    await act(async () => handlers['balance:updated']({ userId: 'u1', newBalance: '87.50' }))

    for (const key of INVALIDATED) expect(queryClient.getQueryState(key)?.isInvalidated, key.join('/')).toBe(true)
    expect(queryClient.getQueryState(UNRELATED)?.isInvalidated).toBe(false)
  })

  it('uses the v5 object form of invalidateQueries with exactly the three keys', async () => {
    const queryClient = seededClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    renderUseSocket(queryClient)

    await act(async () => handlers['balance:updated']({ userId: 'u1', newBalance: '87.50' }))

    expect(invalidate.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: ['wallet'] },
      { queryKey: ['transactions'] },
      { queryKey: ['stats'] },
    ])
  })

  it('never writes the event payload into the cache', async () => {
    const queryClient = seededClient()
    renderUseSocket(queryClient)

    await act(async () => handlers['balance:updated']({ userId: 'u1', newBalance: '87.50' }))

    for (const key of [...INVALIDATED, UNRELATED]) expect(queryClient.getQueryData(key)).toEqual({ seeded: key.join('/') })
  })
})

describe('useSocket — disconnect', () => {
  it('disconnects the socket on unmount', () => {
    const { unmount } = renderUseSocket()
    expect(fakeSocket.disconnect).not.toHaveBeenCalled()

    unmount()

    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1)
  })

  it('disconnects as soon as the user logs out, even before the component unmounts', () => {
    const { rerender } = renderUseSocket()

    currentUserId = undefined
    rerender()

    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1)
    expect(io).toHaveBeenCalledTimes(1)
  })
})
