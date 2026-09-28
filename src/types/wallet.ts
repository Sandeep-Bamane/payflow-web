// GET /wallets/me — balance is an exact decimal string from the API; display-only on the client
export type Wallet = {
  id: string
  balance: string
  currency: string
}
