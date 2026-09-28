import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { theme } from '../theme'

// Fresh client per test: no shared cache, and no retries so error states appear immediately
export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

export function createWrapper(queryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    )
  }
}

export function renderWithProviders(ui: ReactElement, queryClient = createTestQueryClient()) {
  return { queryClient, ...render(ui, { wrapper: createWrapper(queryClient) }) }
}
