import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore, createSelector } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App.jsx'
import blueprintsReducer from '../src/features/blueprints/blueprintsSlice.js'

vi.mock('../src/features/blueprints/blueprintsSlice.js', () => ({
  fetchAuthors: () => ({ type: 'blueprints/fetchAuthors' }),
  fetchByAuthor: () => ({ type: 'blueprints/fetchByAuthor' }),
  fetchBlueprint: () => ({ type: 'blueprints/fetchBlueprint' }),
  createBlueprint: () => ({ type: 'blueprints/createBlueprint' }),
  selectTopBlueprints: createSelector(
    [(state) => state.blueprints.all],
    (all) => all || [],
  ),
  default: (
    state = {
      authors: [],
      all: [],
      byAuthor: {},
      current: null,
      status: { authors: 'idle', byAuthor: 'idle', current: 'idle' },
      error: { authors: null, byAuthor: null, current: null },
    },
  ) => state,
}))

function renderApp(initialEntries = ['/']) {
  const store = configureStore({
    reducer: { blueprints: blueprintsReducer },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </Provider>,
  )
}

describe('App header', () => {
  beforeEach(() => localStorage.clear())

  it('muestra el link de Login y esconde el logout cuando no hay sesión', () => {
    renderApp()

    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
    expect(screen.queryByText(/Cerrar sesión/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Nuevo blueprint/i)).not.toBeInTheDocument()
  })

  it('muestra el botón de logout y el link a Nuevo blueprint cuando hay sesión', () => {
    localStorage.setItem('token', 'abc123')
    renderApp()

    expect(screen.getByText(/Cerrar sesión/i)).toBeInTheDocument()
    expect(screen.getByText(/Nuevo blueprint/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument()
  })

  it('cerrar sesión borra el token y vuelve a mostrar el link de Login', () => {
    localStorage.setItem('token', 'abc123')
    renderApp()

    fireEvent.click(screen.getByText(/Cerrar sesión/i))

    expect(localStorage.getItem('token')).toBeNull()
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
  })
})
