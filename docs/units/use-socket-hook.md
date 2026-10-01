# Unit: useSocket hook — wire balance:updated to query invalidation

No new component. This hook connects once, listens for
balance:updated, and invalidates the same three query keys Unit 4c
already invalidates after a manual transfer — this is the OTHER
trigger for the same refresh, not a new refresh mechanism.

Hook: useSocket()
- Connects once per authenticated session — mount this at the app
  root (e.g. inside the same layout that renders Navbar/
  ProtectedRoute), NOT inside DashboardPage. If it's mounted per-page,
  navigating away and back reconnects unnecessarily, and the whole
  point is one persistent connection for the session.
- Sends the current JWT in the connection's auth payload:
    io(SOCKET_URL, { auth: { token: <same token apiClient reads} } })
- On 'balance:updated', call the SAME invalidations Unit 4c's
  onSuccess already does:
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  Do NOT read newBalance out of the event payload and try to write it
  directly into the cache — invalidate-and-refetch only, consistent
  with Unit 4c's own decision to avoid optimistic/manual cache writes
  for money values.
- Disconnects the socket on unmount (logout, or the auth-holding
  component unmounting) — do not leave a stale authenticated socket
  connected after logout
- If the connection drops (network blip), socket.io's own default
  reconnection behavior is enough for this unit — no custom retry
  logic needs to be written

Rules:
- No UI of its own — this is a pure side-effect hook, nothing renders
  from it directly
- Don't duplicate the three invalidateQueries calls as a new copy —
  either call the exact same handler Unit 4c's useTransfer uses, or
  extract that three-call block into one small shared function
  (e.g. src/utils/invalidateWalletQueries.ts) that BOTH useTransfer's
  onSuccess and this hook's event listener call. Two independently
  maintained copies of "the three keys to invalidate" is the same
  duplication risk Unit 2 and Unit 3 already avoided with the shared
  currency formatter — don't reintroduce it here.

Done when:
- A test proves the socket connects with the JWT in its auth payload
- A test proves receiving balance:updated triggers all three
  invalidations (same key-checking rigor as Unit 4c's test — assert
  on the actual keys, not just call count)
- A test proves the socket disconnects on unmount
- Manual check: two logged-in browser sessions (or two tabs), submit
  a transfer from one, watch the OTHER one's dashboard update without
  any action in that tab — this is the scenario Unit 4c's
  invalidateQueries alone could never cover, since that only fires
  for the tab that submitted the transfer