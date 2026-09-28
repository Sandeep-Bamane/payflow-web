# Unit: Transfer success → cache invalidation

No new endpoint. No new component. This unit only changes
useTransfer's onSuccess behavior.

Change: in useTransfer (Unit 4b), add onSuccess to the useMutation
config:

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  }

Rules:
- All three keys — not just ['wallet']. StatsCards (Unit 3) also
  changes after a transfer (monthlyNet, transactionCount), and it's
  easy to forget it exists since it wasn't the thing you were just
  staring at while building the form
- Use the object form { queryKey: [...] } for invalidateQueries, not
  the deprecated positional-array form — check whichever TanStack
  Query version is actually installed, since the API shape changed
  between v4 and v5
- invalidateQueries triggers a refetch of any currently-mounted query
  with a matching key — it does not manually overwrite the cache with
  new data. This unit doesn't compute or guess new values; it just
  tells the existing hooks to go fetch fresh ones.
- Explicitly NOT in scope: optimistic updates (updating the UI before
  the server confirms). This is a straightforward invalidate-then-
  refetch, not an optimistic-then-reconcile pattern — don't let Claude
  add optimistic update logic here, it's a different, riskier pattern
  for a financial app and wasn't asked for

Done when: a test proves all three query keys are actually invalidated
after a successful mutation, and a manual check proves it in the
running app across two different dashboard cards at once.