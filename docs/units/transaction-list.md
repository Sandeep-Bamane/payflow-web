# Unit: TransactionList component

Endpoint: GET /wallets/me/transactions?limit=5
  → { results: Array<{ id, type: 'credit'|'debit', amount: string,
      counterpartyEmail: string, status: 'completed'|'pending'|'failed',
      createdAt: string }> }

Hook: useTransactions(limit = 5) → TanStack Query, queryKey ['transactions', limit]

Component: TransactionList
- Renders a list of rows inside a Card, one row per transaction
- Each row: counterpartyEmail (body1), createdAt formatted as relative
  or short date (body2, text.secondary), amount with sign+color per
  design-system.md "Amount Display" rule, status Chip per
  "Status Badge" rule

States (all required, per design-system.md "State Handling"):
- loading: Skeleton variant="rectangular" height={80}, one per expected row
- error: "Failed to load" in error color
- empty (results.length === 0): EmptyState — "No transactions yet —
  send your first transfer" (this is a real gap today, not a
  hypothetical; there is no seed data for a fresh wallet)
- success: the rows

Rules:
- No amount arithmetic or currency formatting logic duplicated here —
  reuse whatever formatter Unit 1 (WalletBalance) already wrote; if
  none was extracted into a shared util, extract it now rather than
  copy-pasting the Intl.NumberFormat call
- Uses apiClient only
- Row order is whatever the backend returns — do not re-sort client-side

Explicitly out of scope for this unit:
- Pagination / "load more" (only the first 5 are fetched)
- Click-through to a transaction detail view
- Auto-refresh after a transfer (that's Unit 4c, invalidateQueries)