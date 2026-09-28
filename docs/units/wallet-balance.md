# Unit: WalletBalance card

Endpoint: GET /wallets/me → { id: string, balance: string, currency: string }
Hook: useWallet() → TanStack Query, queryKey ['wallet']
Component: WalletBalance, a Card with label "Balance" and the value

States (all required):
- loading: Skeleton in place of the value
- error: "Failed to load" in error color
- success: formatted currency, e.g. $1,240.00

Rules:
- No arithmetic on balance in the frontend; it is display-only
- Uses apiClient only, no axios or fetch
- Follows docs/design-system.md (label body2 secondary, value h5 weight 500)

Out of scope: the other two stat cards, transfer form, live updates