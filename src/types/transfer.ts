import type { TransactionStatus, TransactionType } from './transaction'

// POST /wallets/transfer — amount is a decimal string ("12.50"), passed through exactly as typed
export type TransferRequest = {
  toUserId: string
  amount: string
  idempotencyKey: string
}

// 201 (new) / 200 (replayed key): the sender's debit leg
export type TransferResult = {
  id: string
  walletId: string
  type: TransactionType
  amount: string
  status: TransactionStatus
}
