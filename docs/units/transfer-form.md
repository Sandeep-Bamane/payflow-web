# Unit: TransferForm component

Endpoint: POST /wallets/transfer
  Request: { recipientId: string, amount: string, idempotencyKey: string }
  (confirm exact field names and whether idempotencyKey is a header
  instead — check the actual route before building)
  Response success: { transactionId: string, newBalance: string }
  Response failure (insufficient funds, invalid recipient, etc.):
  standard error shape — check centralized error handling contract

Hook: useTransfer() → TanStack Query useMutation
  - mutationFn calls apiClient.post('/wallets/transfer', payload)
  - does NOT call invalidateQueries itself — that's explicitly Unit 4c,
    kept separate so this unit's tests aren't coupled to cache
    behavior of components built earlier

Component: TransferForm
- Contains RecipientAutocomplete (Unit 4a) + amount TextField + submit
  Button, per design-system.md TextField/Button rules
- Amount input: numeric, reject non-numeric input at the input level;
  reject zero or negative on submit with inline error, not just
  a disabled button with no explanation
- Idempotency key: generated ONCE per form mount (crypto.randomUUID()
  or equivalent) via useRef or useState initializer — NOT regenerated
  on every render, and NOT regenerated on every submit click. It must
  survive a retry of the same submission (e.g. the user double-clicks,
  or the request times out and something retries it) so the backend
  can recognize it as the same attempt. It only regenerates when the
  form is reset after a successful transfer or the user navigates
  away and back.
- Submit button: disabled while mutation isPending, shows a
  CircularProgress inside the button per design-system.md's rule for
  button-internal loading (not a page-level Skeleton)
- Submit button: also disabled until RecipientAutocomplete has a
  selected recipient (Unit 4a's onChange contract) AND amount is a
  valid positive number
- On success: clear the form (new idempotency key generated), show a
  success message (Alert, per design-system.md's form-level error
  convention — same component, success variant)
- On error: Alert with the server's error message, form fields remain
  populated so the user doesn't have to re-enter everything, but the
  idempotency key is NOT regenerated on error (a retry of a failed
  request should reuse the same key unless the user changes the
  recipient or amount)

Rules:
- Never construct the transfer amount from floating point math
  anywhere in this component — it's a string in, string out; no
  parseFloat + toFixed round-tripping
- No arithmetic on newBalance in the response — if it's displayed
  anywhere in this unit (it isn't; display is out of scope here),
  it would be shown as-is

Explicitly out of scope for this unit:
- Refreshing WalletBalance/TransactionList/StatsCards after success
  (Unit 4c)
- Displaying newBalance anywhere
- Retry UI beyond the browser's natural retry-by-resubmit