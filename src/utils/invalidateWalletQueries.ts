import type { QueryClient } from '@tanstack/react-query'

// The one list of queries a balance change makes stale — used after our own transfer (useTransfer) and when the
// server says a balance changed (useSocket). Invalidate-then-refetch only: never write money values into the cache.
// All three: balance, stats (count + monthly net) and every transactions page (['transactions'] prefix-matches
// ['transactions', limit]).
export function invalidateWalletQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['wallet'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['stats'] }),
  ])
}
