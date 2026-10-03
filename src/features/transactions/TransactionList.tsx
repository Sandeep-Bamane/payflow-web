import { Box, Card, CardContent, List, ListItem, Skeleton, Stack, Typography } from '@mui/material'
import { useTransactions } from '../../hooks/useTransactions'
import { useWallet } from '../../hooks/useWallet'
import { AmountText } from '../../components/AmountText'
import { StatusChip } from '../../components/StatusChip'
import { EmptyState } from '../../components/EmptyState'
import { formatRelativeDate } from '../../utils/formatDate'
import { TransactionInsight } from './TransactionInsight'

const LIMIT = 5

export function TransactionList() {
  const transactions = useTransactions(LIMIT)
  // Items carry no currency; the wallet's currency (already cached by the Balance card) formats them
  const wallet = useWallet()

  let content
  if (transactions.data && wallet.data) {
    const { currency } = wallet.data
    content =
      transactions.data.transactions.length === 0 ? (
        <EmptyState message="No transactions yet — send your first transfer" />
      ) : (
        // Rendered in API order (newest first); never re-sorted client-side
        <List disablePadding>
          {transactions.data.transactions.map((tx) => (
            // flexWrap lets TransactionInsight's panel wrap onto its own line below the row
            <ListItem key={tx.id} disableGutters divider sx={{ py: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body1" noWrap>
                  {tx.counterpartyEmail ?? (tx.description || 'Unknown')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {formatRelativeDate(tx.createdAt)}
                </Typography>
              </Box>
              <Stack sx={{ alignItems: 'flex-end', gap: 0.5, ml: 2 }}>
                <AmountText amount={tx.amount} currency={currency} type={tx.type} />
                <StatusChip status={tx.status} />
              </Stack>
              <TransactionInsight transactionId={tx.id} />
            </ListItem>
          ))}
        </List>
      )
  } else if (transactions.isPending || wallet.isPending) {
    content = (
      <Stack sx={{ gap: 1 }}>
        {Array.from({ length: LIMIT }, (_, i) => (
          <Skeleton key={i} variant="rectangular" height={80} />
        ))}
      </Stack>
    )
  } else {
    content = (
      <Typography color="error" variant="body2">
        Failed to load
      </Typography>
    )
  }

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent transactions
        </Typography>
        {content}
      </CardContent>
    </Card>
  )
}
