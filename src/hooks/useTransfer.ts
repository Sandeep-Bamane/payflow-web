import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { invalidateWalletQueries } from '../utils/invalidateWalletQueries'
import type { TransferRequest, TransferResult } from '../types/transfer'

export function useTransfer() {
  const queryClient = useQueryClient()
  return useMutation<TransferResult, unknown, TransferRequest>({
    mutationFn: (payload) => apiClient.post<TransferResult>('/wallets/transfer', payload).then((res) => res.data),
    // No optimistic update: mounted hooks re-fetch the server's numbers. Returning the promise keeps the mutation
    // pending until the refetches land, so "Transfer sent" never appears next to a stale balance.
    onSuccess: () => invalidateWalletQueries(queryClient),
  })
}
