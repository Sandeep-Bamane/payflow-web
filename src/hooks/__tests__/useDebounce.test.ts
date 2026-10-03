import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

// Fake timers: the 300ms delay is advanced instantly, so these tests never actually wait
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('a', 300))

    expect(result.current).toBe('a')
  })

  it('publishes a new value only once the delay has fully elapsed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), { initialProps: { value: 'a' } })

    rerender({ value: 'ab' })
    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('ab')
  })

  it('collapses rapid changes into the last value, 300ms after the last change', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), { initialProps: { value: '' } })

    for (const value of ['a', 'ab', 'abc']) {
      rerender({ value })
      act(() => vi.advanceTimersByTime(100))
    }
    expect(result.current).toBe('')

    act(() => vi.advanceTimersByTime(199))
    expect(result.current).toBe('')
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('abc')
  })

  it('clears its pending timer on unmount', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebounce(value, 300), { initialProps: { value: 'a' } })

    rerender({ value: 'ab' })
    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
