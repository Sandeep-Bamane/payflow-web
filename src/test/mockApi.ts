import type { Mock } from 'vitest'

export type GetMock = Mock<(url: string, config?: { params?: Record<string, unknown> }) => Promise<{ data: unknown }>>
export type PostMock<Body = unknown> = Mock<(url: string, body: Body) => Promise<{ data: unknown }>>

// Shape of an axios error carrying the API's { error } body
export function apiError(status: number, error: string) {
  return Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data: { error } } })
}

// Route a mocked apiClient.get by URL so components using several hooks get the right response each
export function routeGet(get: GetMock, routes: Record<string, () => Promise<unknown>>) {
  get.mockImplementation((url) => {
    const handler = routes[url]
    if (!handler) return Promise.reject(new Error(`Unmocked GET ${url}`))
    return handler().then((data) => ({ data }))
  })
}

export const never = () => new Promise<never>(() => {})
export const fail = () => Promise.reject(new Error('Network Error'))

// Theme palette values are hex; computed styles are rgb()
export function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}
