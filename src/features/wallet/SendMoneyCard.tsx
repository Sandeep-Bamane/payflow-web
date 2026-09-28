import { Card, CardContent, Typography } from '@mui/material'
import { TransferForm } from './TransferForm'

export function SendMoneyCard() {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" component="h2">
          Send money
        </Typography>
        <TransferForm />
      </CardContent>
    </Card>
  )
}
