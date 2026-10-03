// GET /transactions/:id/insight — explanation is null when not anomalous, or when the AI explanation failed
export type InsightFlag = { type: string; detail: string }

export type TransactionInsight = {
  isAnomalous: boolean
  flags: InsightFlag[]
  explanation: string | null
}
