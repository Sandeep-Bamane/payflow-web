import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { WalletStats } from '../types/stats'

// The server resolves the wallet from the access token — no id is ever passed
export function useStats() {
  return useQuery<WalletStats>({
    queryKey: ['stats'],
    queryFn: () => apiClient.get<WalletStats>('/wallets/me/stats').then((res) => res.data),
  })
}
