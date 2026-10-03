import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Navbar } from '../Navbar'
import { AuthContext, type AuthContextType } from '../../context/authContext'
import { renderWithProviders } from '../../test/renderWithProviders'

function renderNavbar(email: string | undefined) {
  const auth: AuthContextType = { userId: 'u1', email, login: vi.fn(), register: vi.fn(), logout: vi.fn() }
  return renderWithProviders(
    <AuthContext.Provider value={auth}>
      <Navbar />
    </AuthContext.Provider>,
  )
}

describe('Navbar', () => {
  it('shows the wordmark, the signed-in email and its initial as the avatar', () => {
    renderNavbar('sandeep@test.com')

    expect(screen.getByText('PayFlow')).toBeInTheDocument()
    expect(screen.getByText('sandeep@test.com')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('still renders the wordmark when no email is stored', () => {
    renderNavbar(undefined)

    expect(screen.getByText('PayFlow')).toBeInTheDocument()
  })
})
