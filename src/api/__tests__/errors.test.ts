import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from '../errors'
import { apiError } from '../../test/mockApi'

describe('getApiErrorMessage', () => {
  it("returns the server's { error } message", () => {
    expect(getApiErrorMessage(apiError(400, 'Insufficient balance'))).toBe('Insufficient balance')
  })

  it('returns undefined when there is no server message', () => {
    expect(getApiErrorMessage(new Error('Network Error'))).toBeUndefined()
    expect(getApiErrorMessage({ response: { data: { error: 42 } } })).toBeUndefined()
    expect(getApiErrorMessage(null)).toBeUndefined()
  })
})
