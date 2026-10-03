import { Grid, Skeleton, Typography } from '@mui/material'
import { useStats } from '../../hooks/useStats'
import { useWallet } from '../../hooks/useWallet'
import { StatCard } from '../../components/StatCard'
import { formatMoney, isNegativeAmount } from '../../utils/formatMoney'

// Height of a rendered StatCard (24px padding ×2 + body2 label + h5 value, measured in the browser),
// so loading doesn't shift layout
const CARD_HEIGHT = 105

// One-off 2-card row (sm=6 each); the design system's 3-column rule still applies elsewhere
export function StatsCards() {
  const stats = useStats()
  // Stats carry no currency; the wallet's currency (already cached by the Balance card) formats the net
  const wallet = useWallet()

  // Data wins over error: a failed background refetch keeps the last values on screen
  if (stats.data && wallet.data) {
    const { transactionCount, monthlyNet } = stats.data
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard label="Transactions">
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              {transactionCount}
            </Typography>
          </StatCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard label="This Month">
            <Typography
              variant="h5"
              sx={{ fontWeight: 500, color: isNegativeAmount(monthlyNet) ? 'error.main' : 'success.main' }}
            >
              {formatMoney(monthlyNet, wallet.data.currency, { forceSign: true })}
            </Typography>
          </StatCard>
        </Grid>
      </Grid>
    )
  }

  if (stats.isPending || wallet.isPending) {
    return (
      <Grid container spacing={2}>
        {[0, 1].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6 }}>
            <Skeleton variant="rounded" height={CARD_HEIGHT} />
          </Grid>
        ))}
      </Grid>
    )
  }

  return (
    <Typography color="error" variant="body2">
      Failed to load
    </Typography>
  )
}
