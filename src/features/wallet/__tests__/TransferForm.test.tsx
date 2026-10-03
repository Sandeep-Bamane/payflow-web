import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { apiClient } from '../../../api/client'
import { TransferForm } from '../TransferForm'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { apiError, type GetMock, type PostMock } from '../../../test/mockApi'
import type { TransferRequest, TransferResult } from '../../../types/transfer'
import type { UserSummary } from '../../../types/user'

vi.mock('../../../api/client', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }))
const get = apiClient.get as unknown as GetMock
const post = apiClient.post as unknown as PostMock<TransferRequest>

const alice: UserSummary = { id: 'u2', email: 'alice@test.com' }
const bob: UserSummary = { id: 'u3', email: 'bob@test.com' }
const ok: TransferResult = { id: 't1', walletId: 'w1', type: 'debit', amount: '12.50', status: 'completed' }

// Deterministic, countable idempotency keys: key-1, key-2, …
let uuidCalls = 0
beforeEach(() => {
  vi.useFakeTimers()
  uuidCalls = 0
  vi.spyOn(crypto, 'randomUUID').mockImplementation(
    () => `key-${++uuidCalls}` as ReturnType<typeof crypto.randomUUID>,
  )
  get.mockImplementation((_url, config) => {
    const q = String(config?.params?.q ?? '')
    return Promise.resolve({ data: { users: [alice, bob].filter((u) => u.email.includes(q)) } })
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// Each clock step in its own act() so React commits between steps (see RecipientAutocomplete tests)
async function advance(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms))
  await act(() => vi.advanceTimersByTimeAsync(0))
  await act(() => vi.advanceTimersByTimeAsync(0))
}

const recipientInput = () => screen.getByRole('combobox', { name: 'Recipient email' }) as HTMLInputElement
const amountInput = () => screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement
const sendButton = () => screen.getByRole('button', { name: 'Send' })
const sentKeys = () => post.mock.calls.map(([, body]) => body.idempotencyKey)

async function selectRecipient(user: UserSummary) {
  act(() => recipientInput().focus())
  fireEvent.change(recipientInput(), { target: { value: user.email.slice(0, 3) } })
  await advance(300)
  fireEvent.click(screen.getByRole('option', { name: user.email }))
}

function typeAmount(text: string) {
  fireEvent.change(amountInput(), { target: { value: text } })
}

async function fillAndSubmit(user: UserSummary, amount: string) {
  await selectRecipient(user)
  typeAmount(amount)
  fireEvent.click(sendButton())
  await advance(0)
}

describe('TransferForm — fields and validation', () => {
  it('renders the recipient field, an Amount field and a disabled Send button', () => {
    renderWithProviders(<TransferForm />)

    expect(recipientInput()).toBeInTheDocument()
    expect(amountInput()).toHaveAttribute('inputmode', 'decimal')
    expect(sendButton()).toBeDisabled()
  })

  it('ignores non-numeric input, a minus sign, a second dot, and a third decimal', () => {
    renderWithProviders(<TransferForm />)

    typeAmount('abc')
    expect(amountInput().value).toBe('')
    typeAmount('-5')
    expect(amountInput().value).toBe('')
    typeAmount('12.5')
    typeAmount('12.5a')
    expect(amountInput().value).toBe('12.5')
    typeAmount('12.50')
    typeAmount('12.505')
    expect(amountInput().value).toBe('12.50')
    typeAmount('12.50.')
    expect(amountInput().value).toBe('12.50')
  })

  it('enables Send only with both a selected recipient and a positive amount', async () => {
    renderWithProviders(<TransferForm />)

    typeAmount('5')
    expect(sendButton()).toBeDisabled() // amount, no recipient

    typeAmount('')
    await selectRecipient(alice)
    expect(sendButton()).toBeDisabled() // recipient, no amount

    typeAmount('5')
    expect(sendButton()).toBeEnabled()
  })

  it('explains a zero amount inline and keeps Send disabled', async () => {
    renderWithProviders(<TransferForm />)
    await selectRecipient(alice)

    for (const zero of ['0', '0.00']) {
      typeAmount(zero)
      expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument()
      expect(amountInput()).toHaveAttribute('aria-invalid', 'true')
      expect(sendButton()).toBeDisabled()
    }

    typeAmount('0.01')
    expect(screen.queryByText('Amount must be greater than 0')).not.toBeInTheDocument()
    expect(sendButton()).toBeEnabled()
  })
})

describe('TransferForm — submitting', () => {
  it('posts the recipient id, the amount string exactly as typed, and the idempotency key', async () => {
    post.mockResolvedValue({ data: ok })
    renderWithProviders(<TransferForm />)

    await fillAndSubmit(alice, '12.50')

    expect(post).toHaveBeenCalledWith('/wallets/transfer', { toUserId: 'u2', amount: '12.50', idempotencyKey: 'key-1' })
  })

  it('disables the form and shows a spinner inside Send while the request is pending', async () => {
    post.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<TransferForm />)

    await fillAndSubmit(alice, '12.50')

    expect(sendButton()).toBeDisabled()
    expect(within(sendButton()).getByRole('progressbar')).toBeInTheDocument()
    expect(amountInput()).toBeDisabled()
    expect(recipientInput()).toBeDisabled()
  })

  it('on success: shows a success message, clears the form, and disables Send again', async () => {
    post.mockResolvedValue({ data: ok })
    renderWithProviders(<TransferForm />)

    await fillAndSubmit(alice, '12.50')

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Transfer sent to alice@test.com')
    expect(alert).toHaveClass('MuiAlert-colorSuccess')
    expect(recipientInput().value).toBe('')
    expect(amountInput().value).toBe('')
    expect(sendButton()).toBeDisabled()
  })

  it("on a server error: shows the server's message and keeps both fields filled", async () => {
    post.mockRejectedValue(apiError(400, 'Insufficient balance'))
    renderWithProviders(<TransferForm />)

    await fillAndSubmit(alice, '12.50')

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Insufficient balance')
    expect(alert).toHaveClass('MuiAlert-colorError')
    expect(recipientInput().value).toBe('alice@test.com')
    expect(amountInput().value).toBe('12.50')
    expect(sendButton()).toBeEnabled()
  })

  it('on a network error: shows a generic retry message and keeps both fields filled', async () => {
    post.mockRejectedValue(new Error('timeout of 10000ms exceeded'))
    renderWithProviders(<TransferForm />)

    await fillAndSubmit(alice, '12.50')

    expect(screen.getByRole('alert')).toHaveTextContent('Transfer failed — try again')
    expect(amountInput().value).toBe('12.50')
  })
})

describe('TransferForm — idempotency key', () => {
  it('is generated once per mount and survives re-renders', async () => {
    // Kept pending: a successful transfer legitimately generates the next key, which would muddy the count
    post.mockReturnValue(new Promise(() => {}))
    const { rerender } = renderWithProviders(<TransferForm />)

    rerender(<TransferForm />)
    rerender(<TransferForm />)
    await fillAndSubmit(alice, '12.50') // every keystroke and selection re-renders too

    expect(sentKeys()).toEqual(['key-1'])
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })

  it('stays the same across StrictMode double renders', async () => {
    post.mockRejectedValueOnce(apiError(400, 'Insufficient balance')).mockResolvedValueOnce({ data: ok })
    renderWithProviders(
      <StrictMode>
        <TransferForm />
      </StrictMode>,
    )

    await fillAndSubmit(alice, '12.50')
    fireEvent.click(sendButton())
    await advance(0)

    const [first, second] = sentKeys()
    expect(first).toBe(second)
  })

  it('sends only one request for a double-click', async () => {
    post.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<TransferForm />)
    await selectRecipient(alice)
    typeAmount('12.50')

    fireEvent.click(sendButton())
    fireEvent.click(sendButton())
    await advance(0)

    expect(post).toHaveBeenCalledTimes(1)
  })

  it('is reused when retrying after a server error', async () => {
    post.mockRejectedValueOnce(apiError(400, 'Insufficient balance')).mockResolvedValueOnce({ data: ok })
    renderWithProviders(<TransferForm />)

    await fillAndSubmit(alice, '12.50')
    fireEvent.click(sendButton())
    await advance(0)

    expect(sentKeys()).toEqual(['key-1', 'key-1'])
  })

  it('is reused when retrying after a network timeout', async () => {
    post.mockRejectedValueOnce(new Error('timeout of 10000ms exceeded')).mockResolvedValueOnce({ data: ok })
    renderWithProviders(<TransferForm />)

    await fillAndSubmit(alice, '12.50')
    fireEvent.click(sendButton())
    await advance(0)

    expect(sentKeys()).toEqual(['key-1', 'key-1'])
  })

  it('changes after a successful transfer resets the form', async () => {
    post.mockResolvedValue({ data: ok })
    renderWithProviders(<TransferForm />)

    await fillAndSubmit(alice, '12.50')
    // The reset itself generates the next key — not merely the later edits to the empty form
    expect(crypto.randomUUID).toHaveBeenCalledTimes(2)
    await fillAndSubmit(bob, '3')

    expect(sentKeys()).toEqual(['key-1', 'key-2'])
  })

  it('changes when the amount is edited after a failed attempt', async () => {
    post.mockRejectedValueOnce(apiError(400, 'Insufficient balance')).mockResolvedValueOnce({ data: ok })
    renderWithProviders(<TransferForm />)

    await fillAndSubmit(alice, '12.50')
    typeAmount('5')
    fireEvent.click(sendButton())
    await advance(0)

    expect(sentKeys()).toEqual(['key-1', 'key-2'])
  })

  it('changes when the recipient is changed after a failed attempt', async () => {
    post.mockRejectedValueOnce(apiError(404, 'Recipient wallet not found')).mockResolvedValueOnce({ data: ok })
    renderWithProviders(<TransferForm />)

    await fillAndSubmit(alice, '12.50')
    await selectRecipient(bob)
    fireEvent.click(sendButton())
    await advance(0)

    expect(sentKeys()).toEqual(['key-1', 'key-2'])
  })

  it('changes when the form is remounted (navigating away and back)', async () => {
    post.mockResolvedValue({ data: ok })
    const first = renderWithProviders(<TransferForm />)
    first.unmount()

    renderWithProviders(<TransferForm />)
    await fillAndSubmit(alice, '12.50')

    expect(sentKeys()).toEqual(['key-2'])
  })
})
