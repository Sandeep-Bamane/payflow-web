# Unit: RecipientAutocomplete component

Endpoint: GET /users/search?q={query} → { users: Array<{ id: string,
  email: string }> }  (actual backend / system-design.md §4; max 5 results)
  - server trims q and rejects < 2 or > 100 chars with 400; the client's
    >= 3 gate below is stricter, so it never sends a rejected query
  - requester exclusion IS enforced server-side (UserRepository.searchByEmail,
    covered by the API test "never returns the requesting user")
  - debounced server-side search, partial match on email
  - excludes the requester's own account (backend responsibility,
    verify it's actually enforced there, not just client-side)

Hook: useRecipientSearch(query: string) → TanStack Query,
  queryKey ['recipient-search', query], enabled only when query.length >= 3,
  debounce the query value itself (not the query function) by 300ms
  before it reaches the hook

Component: RecipientAutocomplete
- MUI Autocomplete, freeSolo={false} — the user must select a real
  option, not submit arbitrary typed text
- Input label "Recipient email"
- Displays each option's email as the visible label
- On select, the component's onChange prop receives the full
  { id, email } object, not just the display string — the parent
  form needs the real userId, the email is only for display
- While the debounced search is in flight: Autocomplete's built-in
  loading prop (small spinner in the input, not a full Skeleton —
  this is inline in a form field, not a card)
- No results for a valid query: Autocomplete's noOptionsText,
  "No matching user found"
- Error (search request fails): noOptionsText becomes
  "Search failed — try again", distinguishable from the no-results
  case, not silently swallowed

Rules:
- Never let the form submit with a typed-but-unselected email string —
  this is a real fintech risk if it were allowed (sending to a userId
  that doesn't exist, or worse, one that's ambiguous). freeSolo={false}
  plus the onChange contract above is what prevents this; the test
  suite needs a case that proves it
- Uses apiClient only

Out of scope for this unit: the rest of the transfer form, amount
input, submit button, idempotency key generation (all Unit 4b)