import type { ReactNode } from 'react'
import { Card, CardContent, Typography } from '@mui/material'

// Design system "Stat Card": body2 secondary label; the value (h5, weight 500) or its state goes in children
export function StatCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }} gutterBottom>
          {label}
        </Typography>
        {children}
      </CardContent>
    </Card>
  )
}
