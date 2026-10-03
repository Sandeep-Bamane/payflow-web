import { Typography } from '@mui/material'

// Never render an empty list without explaining why it's empty
export function EmptyState({ message }: { message: string }) {
  return (
    <Typography variant="body2" align="center" sx={{ py: 3, color: 'text.secondary' }}>
      {message}
    </Typography>
  )
}
