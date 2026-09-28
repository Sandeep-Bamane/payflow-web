import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { Wallet } from '../types/wallet'

// The server resolves the wallet from the access token — no id is ever passed
export function useWallet() {
  return useQuery<Wallet>({
    queryKey: ['wallet'],
    queryFn: () => apiClient.get<Wallet>('/wallets/me').then((res) => res.data),
  })
}
