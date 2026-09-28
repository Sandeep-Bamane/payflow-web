import { Chip } from '@mui/material'
import type { TransactionStatus } from '../types/transaction'

const STATUS = {
  completed: { label: 'Completed', palette: 'success' },
  pending: { label: 'Pending', palette: 'warning' },
  failed: { label: 'Failed', palette: 'error' },
} as const

// Design system "Status Badge"
export function StatusChip({ status }: { status: TransactionStatus }) {
  const { label, palette } = STATUS[status]
  return <Chip label={label} size="small" sx={{ bgcolor: `${palette}.light`, color: `${palette}.dark` }} />
}
