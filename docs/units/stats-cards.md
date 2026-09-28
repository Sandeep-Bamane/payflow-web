# Unit: StatsCards component

Endpoint: GET /wallets/me/stats
  → { transactionCount: number, monthlyNet: string }

Known gap: transactionCount currently includes all statuses, not just
'completed'. Not this unit's problem to fix — the frontend just
displays whatever the backend returns. Revisit if the backend query
changes.

Hook: useStats() → TanStack Query, queryKey ['stats']

Component: StatsCards
- Renders 2 Stat Cards side by side, per design-system.md "Stat Card"
  spec (label body2 secondary, value h5 weight 500)
- Card 1: label "Transactions", value = transactionCount (plain integer,
  no formatting)
- Card 2: label "This Month", value = monthlyNet formatted as signed
  currency — reuse the currency formatter already extracted for
  WalletBalance/TransactionList (src/utils/currency.ts), but this one
  needs the sign shown explicitly even when positive: "+$300.00" or
  "-$120.00", per design-system.md's Amount Display rule (never rely
  on color alone). Check whether the existing formatter supports a
  forceSign option; if not, extend it rather than writing a second
  one-off formatter here.
- Card 2's value color: success.main if monthlyNet >= 0, error.main
  if negative — same rule as transaction row amounts

States (all required):
- loading: two Skeletons side by side, same shape as the cards they
  replace
- error: "Failed to load" in error color, spans both card slots
- success: the two cards

Layout deviation from design-system.md: this row has 2 cards, not 3.
Use Grid item xs={12} sm={6} for this component specifically. Do not
change the shared 3-column rule in design-system.md itself — that
still applies elsewhere if it's reused; this is a one-off override
here only.

Rules:
- No arithmetic beyond formatting — transactionCount and monthlyNet
  are used exactly as returned
- Uses apiClient only

Out of scope: click-through on either card, historical trend, any
comparison to last month