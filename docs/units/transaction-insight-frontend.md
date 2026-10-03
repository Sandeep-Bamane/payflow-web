# Unit: TransactionInsight component

Endpoint: GET /transactions/:id/insight
  → { isAnomalous: boolean, flags: { type: string, detail: string }[],
      explanation: string | null }

Trigger: NOT fetched automatically for every row in TransactionList
(Unit 2) — that would call this endpoint, and therefore sometimes
Gemini, for every transaction on every dashboard load, which is
wasteful and slow. Instead: each transaction row gets a small
"View insight" button/icon (icon button is fine — a magnifying
glass or info icon). Clicking it fetches on demand for that one
transaction only.

Hook: useTransactionInsight(transactionId: string, enabled: boolean)
  → TanStack Query, queryKey ['transaction-insight', transactionId],
  enabled: enabled (so it only fires once the user actually clicks,
  not on mount — this is the on-demand gate, use TanStack Query's
  enabled option rather than a manual useEffect)

Component: TransactionInsight
- Renders inline (expands below the clicked row) or in a small
  popover/dialog — your call, but whichever you pick, it must not
  shift the other rows around unpredictably; a Collapse that expands
  in place is the simplest, least jarring option
- Loading state: a small inline spinner (CircularProgress, per
  design-system.md's rule that plain spinners are for button-internal
  or inline loads, not card-shaped content — this qualifies as the
  button-internal case)
- Once loaded:
  - If isAnomalous is false: a short line, "No anomalies detected
    for this transaction" (body2, text.secondary) — don't render an
    empty flags list or imply something is wrong when nothing was
    flagged
  - If isAnomalous is true: list each flag's detail string (small
    bullet list or stacked lines), then the explanation text below
    it if present
  - If isAnomalous is true but explanation is null (the 7c graceful-
    degradation case — Gemini failed): show the flags normally, and
    in place of the explanation show "AI explanation unavailable
    right now" (body2, text.secondary, NOT styled as an error — this
    is an expected, handled state per 7c's spec, not a failure the
    user needs to worry about)
- Error state (the HTTP request itself failed, not the Gemini-inside-
  the-response case above): "Failed to load insight" in error color,
  per design-system.md's existing error convention

Rules:
- Do not add is Anomalous/flags fetching logic to TransactionList
  itself — TransactionList stays exactly as Unit 2 left it, this is
  a new, separate component composed alongside each row
- No polling, no auto-refresh — one fetch per click, cached by
  TanStack Query per transactionId so re-opening an already-fetched
  row doesn't refetch

Done when:
- Test: clicking "View insight" triggers the fetch (and only then,
  not on row render)
- Test: isAnomalous: false renders the "no anomalies" line, not an
  empty list
- Test: isAnomalous: true with explanation renders both flags and
  explanation
- Test: isAnomalous: true with explanation: null renders flags plus
  the "unavailable" line, not styled as an error
- Test: a failed HTTP request (not a Gemini failure, an actual
  network/500 error) renders "Failed to load insight"