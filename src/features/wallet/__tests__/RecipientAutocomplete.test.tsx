import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { useState } from 'react'
import { apiClient } from '../../../api/client'
import { RecipientAutocomplete } from '../RecipientAutocomplete'
import { renderWithProviders } from '../../../test/renderWithProviders'
import type { GetMock } from '../../../test/mockApi'
import type { UserSummary } from '../../../types/user'

vi.mock('../../../api/client', () => ({ apiClient: { get: vi.fn() } }))
const get = apiClient.get as unknown as GetMock

const sandeep: UserSummary = { id: 'u2', email: 'sandeep@example.com' }
const sandra: UserSummary = { id: 'u3', email: 'sandra@example.com' }

// Fake timers throughout: debounce delays are advanced instantly. RTL's findBy/waitFor only know how to
// advance Jest's fake clock, so every assertion follows an explicit advance instead.
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// Advances the fake clock AND flushes promises, so mocked requests resolve and TanStack's
// setTimeout(0) notifications run, all without real waiting. Each step gets its own act(): React only
// commits state updates when an act() scope ends, so when the debounce timer fires, the re-render (and
// the query it enables) has to commit before the follow-up 0ms steps can resolve the request.
async function advance(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms))
  await act(() => vi.advanceTimersByTimeAsync(0))
  await act(() => vi.advanceTimersByTimeAsync(0))
}

function respondWith(users: UserSummary[]) {
  get.mockResolvedValue({ data: { users } })
}

// Mirrors a real parent form: owns the selected recipient, reports every onChange to the spy
function Harness({ onChange, initial = null }: { onChange: (u: UserSummary | null) => void; initial?: UserSummary | null }) {
  const [value, setValue] = useState<UserSummary | null>(initial)
  return (
    <RecipientAutocomplete
      value={value}
      onChange={(next) => {
        onChange(next)
        setValue(next)
      }}
    />
  )
}

function setup(initial: UserSummary | null = null) {
  const onChange = vi.fn()
  renderWithProviders(<Harness onChange={onChange} initial={initial} />)
  const input = screen.getByRole('combobox', { name: 'Recipient email' }) as HTMLInputElement
  return { onChange, input }
}

// Focus first, like a real user: MUI resets an unfocused Autocomplete's input text on re-render
function type(input: HTMLInputElement, text: string) {
  act(() => input.focus())
  fireEvent.change(input, { target: { value: text } })
}

describe('RecipientAutocomplete', () => {
  it('renders the "Recipient email" input', () => {
    setup()

    expect(screen.getByRole('combobox', { name: 'Recipient email' })).toBeInTheDocument()
  })

  it('does not search until 300ms after typing stops, then searches exactly once', async () => {
    respondWith([sandeep])
    const { input } = setup()

    type(input, 'san')
    await advance(299)
    expect(get).not.toHaveBeenCalled()

    await advance(1)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/users/search', { params: { q: 'san' } })
  })

  it('collapses rapid typing into a single request for the final text', async () => {
    respondWith([sandeep])
    const { input } = setup()

    for (const text of ['s', 'sa', 'san', 'sand']) {
      type(input, text)
      await advance(100)
    }
    await advance(300)

    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/users/search', { params: { q: 'sand' } })
  })

  it('never searches below 3 characters and says so', async () => {
    const { input } = setup()

    type(input, 'sa')
    await advance(300)

    expect(get).not.toHaveBeenCalled()
    expect(screen.getByText('Type at least 3 characters')).toBeInTheDocument()
  })

  it('shows a spinner in the input while the search is in flight', async () => {
    let resolve: (value: { data: { users: UserSummary[] } }) => void = () => {}
    get.mockReturnValue(new Promise((r) => (resolve = r)))
    const { input } = setup()

    type(input, 'san')
    await advance(300)
    expect(input.closest('.MuiAutocomplete-root')?.querySelector('[role="progressbar"]')).toBeInTheDocument()

    resolve({ data: { users: [sandeep] } })
    await advance(0)
    expect(input.closest('.MuiAutocomplete-root')?.querySelector('[role="progressbar"]')).not.toBeInTheDocument()
  })

  it('lists each result by email, in server order, without filtering them again', async () => {
    // "sandra" doesn't contain "deep" — the server decides matches; the client must not re-filter
    respondWith([sandra, sandeep])
    const { input } = setup()

    type(input, 'deep')
    await advance(300)

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['sandra@example.com', 'sandeep@example.com'])
  })

  it('passes the full { id, email } object to onChange on selection', async () => {
    respondWith([sandeep])
    const { input, onChange } = setup()

    type(input, 'san')
    await advance(300)
    fireEvent.click(screen.getByRole('option', { name: 'sandeep@example.com' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ id: 'u2', email: 'sandeep@example.com' })
    expect(input.value).toBe('sandeep@example.com')
  })

  it('does not search again for the selected email', async () => {
    respondWith([sandeep])
    const { input } = setup()

    type(input, 'san')
    await advance(300)
    fireEvent.click(screen.getByRole('option', { name: 'sandeep@example.com' }))
    await advance(300)

    expect(get).toHaveBeenCalledTimes(1)
  })

  it('never accepts typed text that was not selected, even an exact email match', async () => {
    respondWith([sandeep])
    const { input, onChange } = setup()

    type(input, 'sandeep@example.com')
    await advance(300)
    expect(screen.getByRole('option', { name: 'sandeep@example.com' })).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.blur(input)

    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe('')
  })

  it('calls onChange(null) when the selection is cleared', async () => {
    const { onChange } = setup(sandeep)

    fireEvent.click(screen.getByLabelText('Clear'))

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('says "No matching user found" when a valid search has no results', async () => {
    respondWith([])
    const { input } = setup()

    type(input, 'zzz')
    await advance(300)

    expect(screen.getByText('No matching user found')).toBeInTheDocument()
  })

  it('says "Search failed — try again" when the request fails, distinct from no results', async () => {
    get.mockRejectedValue(new Error('Network Error'))
    const { input } = setup()

    type(input, 'san')
    await advance(300)

    expect(screen.getByText('Search failed — try again')).toBeInTheDocument()
    expect(screen.queryByText('No matching user found')).not.toBeInTheDocument()
  })

  it('shows the controlled value in the input', () => {
    const { input } = setup(sandeep)

    expect(input.value).toBe('sandeep@example.com')
  })
})
