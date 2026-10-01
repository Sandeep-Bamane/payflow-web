# Unit: Dashboard layout & Navbar correction

This is a FIX, not a new feature. Current DashboardPage deviates from
docs/design-system.md in two ways: no Navbar, and Balance merged into
the stats row instead of standing alone. Everything else (Recipient
field, Amount field, TransactionList) is out of scope — do not touch
RecipientAutocomplete.tsx, TransferForm's amount input, or
TransactionList.tsx.

## 1. Add Navbar

New component, src/components/Navbar.tsx — no data fetching, reads
the current user from whatever auth context ProtectedRoute already
uses.

- Height 64px, background #ffffff, border-bottom 1px solid
  rgba(0,0,0,0.08) — flat, not floating (no box-shadow)
- Left: "PayFlow" wordmark, weight 700, ~20px, color text.primary
- Right: user's email (body2, text.secondary) + circular avatar
  (initial letter, primary background, white text)
- Mount it above <PageContainer> in the app's layout (not inside
  DashboardPage) so any future screen gets it automatically

## 2. Fix DashboardPage structure — Balance must not be in the stats row

Current (wrong): one Grid row containing Balance + Transactions +
This Month as 3 equal cards.

Correct:
- Page title "Dashboard" (h4, weight 500) — currently missing
- WalletBalance (Unit 1): full-width card, ALONE, above everything
- Below it, its own row: StatsCards (Unit 3) — exactly 2 cards
  (Transactions, This Month), Grid item xs={12} sm={6} each

Check first whether WalletBalance and StatsCards are still separate
components sharing one Grid row (easy fix: split into two rows), or
were accidentally merged into a single component (bigger fix: pull
them back apart, per Unit 1 and Unit 3's original specs). Read the
actual file before assuming which.

## Explicitly out of scope
- RecipientAutocomplete — whatever it currently is, leave it as-is
- Amount field styling
- TransactionList — already correct

Done when:
- Navbar renders above PageContainer app-wide
- Balance is its own full-width card, separate from the 2-card
  stats row
- Page title "Dashboard" present
- Existing tests for Units 1, 2, 3 still pass unchanged