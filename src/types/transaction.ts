export type TransactionType = 'credit' | 'debit'
export type TransactionStatus = 'completed' | 'pending' | 'failed'

// GET /wallets/me/transactions item — amount is an exact decimal string; display-only on the client
export type Transaction = {
  id: string
  type: TransactionType
  amount: string
  status: TransactionStatus
  description: string
  counterpartyEmail: string | null // null when there's no other party (e.g. a top-up)
  createdAt: string
}

export type TransactionPage = {
  transactions: Transaction[]
  hasMore: boolean
}
