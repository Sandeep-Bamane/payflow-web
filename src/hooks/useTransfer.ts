import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { TransferRequest, TransferResult } from '../types/transfer'

export function useTransfer() {
  const queryClient = useQueryClient()
  return useMutation<TransferResult, unknown, TransferRequest>({
    mutationFn: (payload) => apiClient.post<TransferResult>('/wallets/transfer', payload).then((res) => res.data),
    // Invalidate-then-refetch only: no optimistic update and no cache writes — mounted hooks re-fetch the
    // server's numbers. All three: balance, stats (count + monthly net) and every transactions page
    // (['transactions'] prefix-matches ['transactions', limit]). Returning the promise keeps the mutation
    // pending until the refetches land, so "Transfer sent" never appears next to a stale balance.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
      ]),
  })
}
