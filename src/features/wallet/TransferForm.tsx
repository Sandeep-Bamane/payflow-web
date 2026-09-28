import { useRef, useState, type FormEvent } from 'react'
import { Alert, Box, Button, CircularProgress, TextField } from '@mui/material'
import { RecipientAutocomplete } from './RecipientAutocomplete'
import { useTransfer } from '../../hooks/useTransfer'
import { getApiErrorMessage } from '../../api/errors'
import { isAmountInput, isPositiveAmount } from '../../utils/formatMoney'
import type { UserSummary } from '../../types/user'

type Feedback = { severity: 'success' | 'error'; text: string }

export function TransferForm() {
  const [recipient, setRecipient] = useState<UserSummary | null>(null)
  // Amount stays a string end to end — sent exactly as typed, never parsed or rounded
  const [amount, setAmount] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  // Idempotency key: the initializer runs once per mount, so re-renders keep the same key. It's replaced
  // only after a successful transfer, or when the payload changes after a failed attempt — a plain retry
  // (double-click, timeout, server error) reuses it so the backend recognizes the same transfer.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())
  const [keyUsed, setKeyUsed] = useState(false)
  const rotateKey = () => {
    setIdempotencyKey(crypto.randomUUID())
    setKeyUsed(false)
  }

  // Blocks a second submit before React re-renders with isPending (e.g. a fast double-click)
  const inFlight = useRef(false)
  const transfer = useTransfer()
  const pending = transfer.isPending

  const amountTooSmall = amount !== '' && !isPositiveAmount(amount)
  const canSubmit = recipient !== null && isPositiveAmount(amount) && !pending

  function changeRecipient(next: UserSummary | null) {
    if (keyUsed && next?.id !== recipient?.id) rotateKey()
    setRecipient(next)
  }

  function changeAmount(next: string) {
    if (!isAmountInput(next)) return // reject at the input level: the value simply doesn't change
    if (keyUsed && next !== amount) rotateKey()
    setAmount(next)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit || !recipient || inFlight.current) return

    inFlight.current = true
    setKeyUsed(true)
    setFeedback(null)
    transfer.mutate(
      { toUserId: recipient.id, amount, idempotencyKey },
      {
        onSuccess: () => {
          setFeedback({ severity: 'success', text: `Transfer sent to ${recipient.email}` })
          setRecipient(null)
          setAmount('')
          rotateKey()
        },
        // Fields stay filled and the key is kept, so resubmitting is a true retry
        onError: (error) => {
          setFeedback({ severity: 'error', text: getApiErrorMessage(error) ?? 'Transfer failed — try again' })
        },
        onSettled: () => {
          inFlight.current = false
        },
      },
    )
  }

  return (
    <Box component="form" onSubmit={submit} noValidate>
      <RecipientAutocomplete value={recipient} onChange={changeRecipient} disabled={pending} />
      <TextField
        label="Amount"
        fullWidth
        margin="normal"
        value={amount}
        onChange={(e) => changeAmount(e.target.value)}
        disabled={pending}
        error={amountTooSmall}
        helperText={amountTooSmall ? 'Amount must be greater than 0' : undefined}
        slotProps={{ htmlInput: { inputMode: 'decimal', autoComplete: 'off' } }}
      />
      <Button type="submit" variant="contained" fullWidth disabled={!canSubmit} aria-label="Send" sx={{ mt: 2, py: 1.2 }}>
        {pending ? <CircularProgress size={22} color="inherit" /> : 'Send'}
      </Button>
      {feedback && (
        <Alert severity={feedback.severity} sx={{ mt: 2 }}>
          {feedback.text}
        </Alert>
      )}
    </Box>
  )
}
