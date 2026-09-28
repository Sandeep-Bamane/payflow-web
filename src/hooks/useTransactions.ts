import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { TransactionPage } from '../types/transaction'

// The server resolves the wallet from the access token — no id is ever passed
export function useTransactions(limit = 5) {
  return useQuery<TransactionPage>({
    queryKey: ['transactions', limit],
    queryFn: () =>
      apiClient.get<TransactionPage>('/wallets/me/transactions', { params: { limit } }).then((res) => res.data),
  })
}
