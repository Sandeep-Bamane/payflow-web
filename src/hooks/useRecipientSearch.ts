import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { UserSearchResponse, UserSummary } from '../types/user'

export const MIN_SEARCH_LENGTH = 3

// Expects an already-debounced query. The server excludes the requester and enforces its own minimum (2),
// so this client gate (3) is stricter and never sends a query the server would reject.
export function useRecipientSearch(query: string) {
  const q = query.trim()
  return useQuery<UserSummary[]>({
    queryKey: ['recipient-search', q],
    queryFn: () => apiClient.get<UserSearchResponse>('/users/search', { params: { q } }).then((res) => res.data.users),
    enabled: q.length >= MIN_SEARCH_LENGTH,
  })
}
