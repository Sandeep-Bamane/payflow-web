import { Typography } from '@mui/material'
import type { TransactionType } from '../types/transaction'
import { formatSignedMoney } from '../utils/formatMoney'

type Props = { amount: string; currency: string; type: TransactionType }

// Design system "Amount Display": sign AND color, never color alone (color-blind users rely on +/-)
export function AmountText({ amount, currency, type }: Props) {
  return (
    // MUI 9 no longer resolves palette paths like color="success.main" as a prop; sx does
    <Typography sx={{ color: type === 'credit' ? 'success.main' : 'error.main' }}>
      {formatSignedMoney(amount, currency, type)}
    </Typography>
  )
}
