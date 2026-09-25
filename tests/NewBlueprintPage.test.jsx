import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore, createSlice } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import NewBlueprintPage from '../src/pages/NewBlueprintPage.jsx'

vi.mock('../src/features/blueprints/blueprintsSlice.js', () => ({
  createBlueprint: (payload) => ({ type: 'blueprints/createBlueprint', payload }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function makeStore() {
  const slice = createSlice({ name: 'blueprints', initialState: {}, reducers: {} })
  return configureStore({ reducer: { blueprints: slice.reducer } })
}

describe('NewBlueprintPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('despacha createBlueprint con el payload del formulario y navega a "/" si tiene éxito', async () => {
    const store = makeStore()
    const spy = vi
      .spyOn(store, 'dispatch')
      .mockReturnValue({ unwrap: () => Promise.resolve({ author: 'jdoe', name: 'house' }) })

    render(
      <Provider store={store}>
        <MemoryRouter>
          <NewBlueprintPage />
        </MemoryRouter>
      </Provider>,
    )

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'jdoe' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.submit(screen.getByText(/Guardar/i))

    expect(spy).toHaveBeenCalledWith({
      type: 'blueprints/createBlueprint',
      payload: {
        author: 'jdoe',
        name: 'house',
        points: [
          { x: 10, y: 10 },
          { x: 40, y: 60 },
        ],
      },
    })
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
  })

  it('muestra un mensaje de error si la creación falla (p. ej. 403 por scope insuficiente)', async () => {
    const store = makeStore()
    vi.spyOn(store, 'dispatch').mockReturnValue({
      unwrap: () => Promise.reject('No tienes permisos para crear blueprints'),
    })

    render(
      <Provider store={store}>
        <MemoryRouter>
          <NewBlueprintPage />
        </MemoryRouter>
      </Provider>,
    )

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'student' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.submit(screen.getByText(/Guardar/i))

    await waitFor(() =>
      expect(screen.getByText(/No tienes permisos para crear blueprints/i)).toBeInTheDocument(),
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
