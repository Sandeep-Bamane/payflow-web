// GET /wallets/me/stats — monthlyNet is an exact, already-signed decimal string; display-only on the client
export type WalletStats = {
  transactionCount: number
  monthlyNet: string
}
