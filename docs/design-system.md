# PayFlow — UI Design System

## Design Tokens

### Colors
\```typescript
primary:    '#1a73e8'   // buttons, links, active states
background: '#f5f7fa'   // page background — soft gray, never stark white
surface:    '#ffffff'   // cards, inputs — sits ON TOP of background
text.primary:   '#1a1a1a'
text.secondary: '#6b7280'   // labels, timestamps, muted text
success:    '#2e7d32'   // credit amounts, "Completed" badges
danger:     '#c62828'   // debit amounts, errors, "Log out everywhere"
warning:    '#e65100'   // "Pending" badges
divider:    'rgba(0,0,0,0.08)'
\```
**Rule:** background vs surface must always have visible contrast — cards should look like they're sitting ON the page, not blending into it.

### Typography Scale
\```typescript
h4: 28px, weight 500   // page titles ("Transaction history")
h5: 22px, weight 500   // large stat numbers (balance)
h6: 18px, weight 500   // card section titles ("Send money")
body1: 15px, weight 400   // default body text
body2: 13px, weight 400   // labels, secondary info, timestamps
\```
**Rule:** never use MUI's default `h1`-`h3` in this app — genuinely too large for a dashboard-style product; cap at `h4`.

### Spacing (MUI's 8px base unit — always use `sx` spacing shorthand, never raw pixel margins)
\```
0.5 = 4px   (tight, icon-to-text gaps)
1   = 8px   (default small gap)
2   = 16px  (default gap between related elements)
3   = 24px  (gap between distinct sections within a card)
4-6 = 32-48px  (gap between major page sections)
\```

### Shape
\```typescript
borderRadius: 10px   // cards, buttons, inputs — consistent throughout, set ONCE in theme.ts
\```

### Elevation
\```typescript
card shadow: '0 1px 3px rgba(0,0,0,0.08)'   // soft, never MUI's default harsh shadow
Navbar: elevation={0}, bottom border instead — flat, not floating
\```

---

## Component Specifications

### Card (the base unit almost everything sits inside)
\```typescript
<Card>          // always default MUI Card, styled globally via theme.ts overrides
  <CardContent sx={{ p: 3 }}>   // 24px padding, consistent everywhere
    ...
  </CardContent>
</Card>
\```

### Button
\```typescript
<Button variant="contained" fullWidth sx={{ py: 1.2 }}>Send</Button>
\```
- **Primary actions** (submit, send, log in): `variant="contained"`
- **Secondary actions** (cancel, back): `variant="outlined"` or `variant="text"`
- **Destructive actions** (log out everywhere): `color="error"` + `variant="outlined"`
- **Global rule (set in theme.ts):** `textTransform: 'none'` — never force-uppercase button text

### TextField (forms)
\```typescript
<TextField label="Email" fullWidth margin="normal" value={...} onChange={...} />
\```
- Always `fullWidth` inside a form
- Always `margin="normal"` for automatic, consistent vertical spacing between fields
- Error state: pass `error` boolean + `helperText` prop, not a separate `<Alert>` for field-level validation (reserve `<Alert>` for form-level errors — e.g., "Invalid email or password")

### Stat Card (dashboard summary cards)
\```typescript
<Card>
  <CardContent>
    <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
    <Typography variant="h5" fontWeight={500}>{value}</Typography>
  </CardContent>
</Card>
\```
Label always `body2` + `text.secondary`. Value always `h5` + `fontWeight={500}`. Never deviate — this pairing is what makes stat cards visually consistent across the dashboard.

### Status Badge (transaction status)
\```typescript
<Chip
  label="Completed"
  size="small"
  sx={{
    bgcolor: status === 'completed' ? 'success.light' : status === 'pending' ? 'warning.light' : 'error.light',
    color: status === 'completed' ? 'success.dark' : status === 'pending' ? 'warning.dark' : 'error.dark',
  }}
/>
\```
Use MUI's `Chip`, not a manually-styled `<span>` — genuinely more consistent sizing/padding than hand-rolling it.

### Amount Display (transaction rows)
\```typescript
<Typography color={type === 'credit' ? 'success.main' : 'error.main'}>
  {type === 'credit' ? '+' : '-'}${amount}
</Typography>
\```
**Rule, non-negotiable for a financial app:** every amount must show its sign (+/-) AND its color — never rely on color alone (accessibility — color-blind users must still be able to tell direction from the +/- symbol).

---

## Layout Grid Rules

- **Page-level:** always wrapped in `<PageContainer>` (`maxWidth="md"`, `py: 6`) — no page renders raw content without this wrapper
- **Dashboard's 2-column split:** `Grid item xs={12} md={5}` (form) + `md={7}` (list) — form is intentionally narrower than the list
- **Stat card row:** `Grid item xs={12} sm={4}` — 3 equal columns on tablet+, stacks to 1 column on mobile
- **Auth screens (Login/Register):** NOT wrapped in `PageContainer` — centered independently via `sx={{ maxWidth: 340, mx: 'auto', mt: 10 }}` directly on the `Card`, since these are single-card, non-dashboard layouts

---

## State Handling — required on EVERY data-driven component, no exceptions

\```typescript
if (isLoading) return <Skeleton variant="rectangular" height={80} />;  // NOT a spinner for card-shaped content
if (error) return <Typography color="error" variant="body2">Failed to load</Typography>;
if (data.length === 0) return <EmptyState />;  // never render an empty table/list with no explanation
return <ActualContent />;
\```
**Rule:** `Skeleton` (shape-matching placeholder) for anything card/list-shaped. Plain `CircularProgress` reserved only for full-page loads (e.g., `ProtectedRoute`'s auth check) or button-internal loading (`disabled` + spinner inside a submit button during a mutation).

---

## Honest Gaps — designed but not yet backed by real data
- Dashboard's "Transactions" and "This month" stat cards — no backend aggregation endpoint exists yet
- Empty states for Transaction List — component not yet built, only specified above