import { useId, useState } from 'react'
import { CircularProgress, Collapse, IconButton, Stack, Typography } from '@mui/material'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import { useTransactionInsight } from '../../hooks/useTransactionInsight'

// Rendered as the last child of a TransactionList row. Returns two flex items: the button sits at the row's right
// edge; the Collapse takes 100% width, so with the row's flexWrap it opens on its own line directly below the row.
export function TransactionInsight({ transactionId }: { transactionId: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const insight = useTransactionInsight(transactionId, open)

  let content
  if (insight.data) {
    const { isAnomalous, flags, explanation } = insight.data
    content = !isAnomalous ? (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        No anomalies detected for this transaction
      </Typography>
    ) : (
      // Stacked lines, not a List: no extra list items inside the transaction row
      <Stack sx={{ gap: 0.5 }}>
        {flags.map((flag) => (
          <Typography key={flag.type} variant="body2">
            {flag.detail}
          </Typography>
        ))}
        {explanation ? (
          <Typography variant="body1" sx={{ mt: 0.5 }}>
            {explanation}
          </Typography>
        ) : (
          // Gemini failed but detection succeeded — an expected, handled state, so muted rather than an error
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            AI explanation unavailable right now
          </Typography>
        )}
      </Stack>
    )
  } else if (insight.isError) {
    content = (
      <Typography color="error" variant="body2">
        Failed to load insight
      </Typography>
    )
  } else {
    // Inline load inside the row: a small spinner, not a card-shaped Skeleton
    content = <CircularProgress size={16} />
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label="View insight"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        sx={{ ml: 1 }}
      >
        <InfoOutlined fontSize="small" />
      </IconButton>
      <Collapse in={open} unmountOnExit id={panelId} sx={{ flexBasis: '100%' }}>
        <Stack sx={{ pt: 1, pl: 1 }}>{content}</Stack>
      </Collapse>
    </>
  )
}
