import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from '../src/components/PrivateRoute.jsx'

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route
          path="/private"
          element={
            <PrivateRoute>
              <p>Contenido privado</p>
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => localStorage.clear())

  it('redirige a /login si no hay token', () => {
    renderAt('/private')

    expect(screen.getByText(/Login page/i)).toBeInTheDocument()
    expect(screen.queryByText(/Contenido privado/i)).not.toBeInTheDocument()
  })

  it('renderiza el contenido protegido si hay token', () => {
    localStorage.setItem('token', 'abc123')
    renderAt('/private')

    expect(screen.getByText(/Contenido privado/i)).toBeInTheDocument()
  })
})
