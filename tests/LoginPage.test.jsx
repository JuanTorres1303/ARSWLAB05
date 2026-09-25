import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../src/pages/LoginPage.jsx'

vi.mock('../src/services/http.js', () => ({
  default: { post: vi.fn() },
}))

import http from '../src/services/http.js'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    http.post.mockReset()
    mockNavigate.mockReset()
  })

  it('guarda el access_token, redirige a "/" y no usa alert', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    http.post.mockResolvedValueOnce({ data: { access_token: 'abc123', token_type: 'Bearer' } })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'student' } })
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'student123' } })
    fireEvent.click(screen.getByText(/Ingresar/i))

    await waitFor(() => expect(localStorage.getItem('token')).toBe('abc123'))
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    expect(alertSpy).not.toHaveBeenCalled()

    alertSpy.mockRestore()
  })

  it('acepta el token envuelto en { data: { token } }', async () => {
    http.post.mockResolvedValueOnce({ data: { data: { token: 'xyz789' } } })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'assistant' } })
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'assistant123' } })
    fireEvent.click(screen.getByText(/Ingresar/i))

    await waitFor(() => expect(localStorage.getItem('token')).toBe('xyz789'))
  })

  it('muestra un mensaje de error y no guarda token si las credenciales son inválidas', async () => {
    http.post.mockRejectedValueOnce({ response: { status: 401 } })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'student' } })
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByText(/Ingresar/i))

    await waitFor(() => expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument())
    expect(localStorage.getItem('token')).toBeNull()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
