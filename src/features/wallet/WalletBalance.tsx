import { Skeleton, Typography } from '@mui/material'
import { useWallet } from '../../hooks/useWallet'
import { formatMoney } from '../../utils/formatMoney'
import { StatCard } from '../../components/StatCard'

export function WalletBalance() {
  const { data, isPending } = useWallet()

  // Data wins over error: a failed background refetch keeps the last known balance on screen
  let value
  if (data) {
    value = (
      // MUI 9 dropped system props like fontWeight={...}; style goes through sx
      <Typography variant="h5" sx={{ fontWeight: 500 }}>
        {formatMoney(data.balance, data.currency)}
      </Typography>
    )
  } else if (isPending) {
    value = <Skeleton variant="text" width="60%" sx={{ fontSize: 'h5.fontSize' }} />
  } else {
    value = (
      <Typography color="error" variant="body2">
        Failed to load
      </Typography>
    )
  }

  return <StatCard label="Balance">{value}</StatCard>
}
