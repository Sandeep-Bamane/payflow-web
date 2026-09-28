// The API's error contract is { error: string } with the status on the response. Reads that message from
// a failed request without importing axios outside src/api. undefined → no server message (e.g. network error).
export function getApiErrorMessage(error: unknown): string | undefined {
  const message = (error as { response?: { data?: { error?: unknown } } } | null)?.response?.data?.error
  return typeof message === 'string' ? message : undefined
}
