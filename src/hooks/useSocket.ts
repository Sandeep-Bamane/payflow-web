import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { getAccessToken } from '../api/client'
import { useAuth } from '../context/authContext'
import { invalidateWalletQueries } from '../utils/invalidateWalletQueries'

// Origin only: socket.io reads a URL path as a namespace, and the server has no "/api" namespace
const SOCKET_URL = new URL(import.meta.env.VITE_API_URL).origin

// One socket per logged-in session. Mounted in ProtectedRoute (the layout for all signed-in pages), so moving
// between pages keeps the same connection; logout (userId → undefined) or unmount disconnects it.
export function useSocket(): void {
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const socket = io(SOCKET_URL, {
      // A function, not a value: re-read on every (re)connect, so a reconnect after a token refresh sends the new token
      auth: (cb) => cb({ token: getAccessToken() }),
    })

    // The payload's newBalance is deliberately ignored — refetch from the server, same as after our own transfer
    socket.on('balance:updated', () => {
      void invalidateWalletQueries(queryClient)
    })

    return () => {
      socket.disconnect()
    }
  }, [userId, queryClient])
}
