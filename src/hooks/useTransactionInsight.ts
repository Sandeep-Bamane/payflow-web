import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { TransactionInsight } from '../types/insight'

// On demand only: `enabled` is the gate (false until the user opens the panel), so rendering a row never calls
// this endpoint — and therefore never Gemini. The key doesn't prefix-match ['transactions'], so a transfer's
// invalidations leave open insights alone.
export function useTransactionInsight(transactionId: string, enabled: boolean) {
  return useQuery<TransactionInsight>({
    queryKey: ['transaction-insight', transactionId],
    queryFn: () => apiClient.get<TransactionInsight>(`/transactions/${transactionId}/insight`).then((res) => res.data),
    enabled,
    // A past transaction's insight doesn't change on its own: re-opening, window focus and reconnect never refetch
    staleTime: Infinity,
    // One request per click — an automatic retry could mean another Gemini call. Re-opening after an error
    // (no cached data) is the user's retry.
    retry: false,
  })
}
