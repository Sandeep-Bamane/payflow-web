import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { apiClient } from '../../../api/client'
import { TransactionInsight } from '../TransactionInsight'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { apiError, fail, hexToRgb, never, routeGet, type GetMock } from '../../../test/mockApi'
import { theme } from '../../../theme'
import type { TransactionInsight as Insight } from '../../../types/insight'

vi.mock('../../../api/client', () => ({ apiClient: { get: vi.fn() } }))
const get = apiClient.get as unknown as GetMock

const URL = '/transactions/t1/insight'
const AMOUNT_DETAIL = "Amount 500.00 is above this account's usual range: mean 50.00 over the last 5 debits, threshold 70.00 (mean + 2 × std dev)"
const FREQUENCY_DETAIL = '6 debits in the 60 minutes up to this one (more than 5 is unusual)'

function respond(insight: Insight) {
  return () => Promise.resolve(insight)
}

function renderInsight() {
  return renderWithProviders(<TransactionInsight transactionId="t1" />)
}

function toggle() {
  fireEvent.click(screen.getByRole('button', { name: 'View insight' }))
}

// Let pending promises (and any query that wrongly fired on mount) settle
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('TransactionInsight — on-demand fetch', () => {
  it('does not fetch on render, only a closed "View insight" button', async () => {
    routeGet(get, { [URL]: respond({ isAnomalous: false, flags: [], explanation: null }) })

    renderInsight()
    await flush()

    expect(get).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'View insight' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('No anomalies detected for this transaction')).not.toBeInTheDocument()
  })

  it('fetches this one transaction only when clicked', async () => {
    routeGet(get, { [URL]: respond({ isAnomalous: false, flags: [], explanation: null }) })

    renderInsight()
    toggle()

    expect(await screen.findByText('No anomalies detected for this transaction')).toBeInTheDocument()
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith(URL)
    expect(screen.getByRole('button', { name: 'View insight' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows a small inline spinner while loading, not a skeleton', async () => {
    routeGet(get, { [URL]: never })

    const { container } = renderInsight()
    toggle()

    expect(await screen.findByRole('progressbar')).toBeInTheDocument()
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0)
  })

  it('caches per transaction: closing and re-opening does not refetch', async () => {
    routeGet(get, { [URL]: respond({ isAnomalous: false, flags: [], explanation: null }) })

    renderInsight()
    toggle()
    await screen.findByText('No anomalies detected for this transaction')
    toggle()
    await flush()
    toggle()

    expect(await screen.findByText('No anomalies detected for this transaction')).toBeInTheDocument()
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('collapses the panel on a second click', async () => {
    routeGet(get, { [URL]: respond({ isAnomalous: false, flags: [], explanation: null }) })

    renderInsight()
    toggle()
    await screen.findByText('No anomalies detected for this transaction')
    toggle()

    expect(screen.getByRole('button', { name: 'View insight' })).toHaveAttribute('aria-expanded', 'false')
    await vi.waitFor(() => expect(screen.queryByText('No anomalies detected for this transaction')).not.toBeInTheDocument())
  })
})

describe('TransactionInsight — results', () => {
  it('renders the "no anomalies" line in text.secondary, not an empty flags list', async () => {
    routeGet(get, { [URL]: respond({ isAnomalous: false, flags: [], explanation: null }) })

    renderInsight()
    toggle()

    const line = await screen.findByText('No anomalies detected for this transaction')
    expect(getComputedStyle(line).color).toBe(theme.palette.text.secondary)
    expect(screen.queryByText('AI explanation unavailable right now')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('renders every flag detail and the explanation when anomalous', async () => {
    routeGet(get, {
      [URL]: respond({
        isAnomalous: true,
        flags: [
          { type: 'unusual_amount', detail: AMOUNT_DETAIL },
          { type: 'unusual_frequency', detail: FREQUENCY_DETAIL },
        ],
        explanation: 'This payment is larger than usual.',
      }),
    })

    renderInsight()
    toggle()

    expect(await screen.findByText(AMOUNT_DETAIL)).toBeInTheDocument()
    expect(screen.getByText(FREQUENCY_DETAIL)).toBeInTheDocument()
    expect(screen.getByText('This payment is larger than usual.')).toBeInTheDocument()
    expect(screen.queryByText('AI explanation unavailable right now')).not.toBeInTheDocument()
    expect(screen.queryByText('No anomalies detected for this transaction')).not.toBeInTheDocument()
  })

  it('renders the flags plus a muted "unavailable" line, not an error, when the explanation is null', async () => {
    routeGet(get, {
      [URL]: respond({ isAnomalous: true, flags: [{ type: 'unusual_amount', detail: AMOUNT_DETAIL }], explanation: null }),
    })

    renderInsight()
    toggle()

    expect(await screen.findByText(AMOUNT_DETAIL)).toBeInTheDocument()
    const unavailable = screen.getByText('AI explanation unavailable right now')
    expect(getComputedStyle(unavailable).color).toBe(theme.palette.text.secondary)
    expect(getComputedStyle(unavailable).color).not.toBe(hexToRgb(theme.palette.error.main))
    expect(screen.queryByText('Failed to load insight')).not.toBeInTheDocument()
  })
})

describe('TransactionInsight — request failure', () => {
  it('renders "Failed to load insight" in the error color after one request (no automatic retries)', async () => {
    routeGet(get, { [URL]: fail })

    renderInsight()
    toggle()

    const message = await screen.findByText('Failed to load insight')
    expect(getComputedStyle(message).color).toBe(hexToRgb(theme.palette.error.main))
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('renders "Failed to load insight" for a 500 response', async () => {
    routeGet(get, { [URL]: () => Promise.reject(apiError(500, 'Internal server error')) })

    renderInsight()
    toggle()

    expect(await screen.findByText('Failed to load insight')).toBeInTheDocument()
  })
})
