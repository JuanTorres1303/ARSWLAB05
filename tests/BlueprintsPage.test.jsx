import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore, createSelector, createSlice } from '@reduxjs/toolkit'
import BlueprintsPage from '../src/pages/BlueprintsPage.jsx'

// Mock de thunks/selectores del slice para no requerir backend
vi.mock('../src/features/blueprints/blueprintsSlice.js', () => ({
  fetchAuthors: () => ({ type: 'blueprints/fetchAuthors' }),
  fetchByAuthor: (author) => ({ type: 'blueprints/fetchByAuthor', payload: author }),
  fetchBlueprint: (payload) => ({ type: 'blueprints/fetchBlueprint', payload }),
  selectTopBlueprints: createSelector(
    [(state) => state.blueprints.all],
    (all) => [...(all || [])].sort((a, b) => (b.points?.length || 0) - (a.points?.length || 0)).slice(0, 5),
  ),
}))

function makeStore(preloaded) {
  const slice = createSlice({
    name: 'blueprints',
    initialState: {
      authors: [],
      all: [],
      byAuthor: {},
      current: null,
      status: { authors: 'idle', byAuthor: 'idle', current: 'idle' },
      error: { authors: null, byAuthor: null, current: null },
      ...preloaded,
    },
    reducers: {},
  })
  return configureStore({ reducer: { blueprints: slice.reducer } })
}

describe('BlueprintsPage', () => {
  it('despacha fetchByAuthor al hacer click en Get blueprints', () => {
    const store = makeStore()
    const spy = vi.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'JohnConnor' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))

    expect(spy).toHaveBeenCalledWith({ type: 'blueprints/fetchByAuthor', payload: 'JohnConnor' })
  })

  it('muestra "Cargando..." mientras status.byAuthor está en loading', () => {
    const store = makeStore({ status: { authors: 'idle', byAuthor: 'loading', current: 'idle' } })
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    expect(screen.getByText(/Cargando\.\.\./i)).toBeInTheDocument()
  })

  it('muestra el banner de error de búsqueda y reintenta con el mismo autor', () => {
    const store = makeStore({
      status: { authors: 'idle', byAuthor: 'failed', current: 'idle' },
      error: { authors: null, byAuthor: 'Backend caído', current: null },
    })
    const spy = vi.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    expect(screen.getByText(/Backend caído/i)).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'JohnConnor' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))
    spy.mockClear()

    fireEvent.click(screen.getByText(/Reintentar/i))

    expect(spy).toHaveBeenCalledWith({ type: 'blueprints/fetchByAuthor', payload: 'JohnConnor' })
  })

  it('muestra el banner de error del plano actual cuando falla fetchBlueprint', () => {
    const store = makeStore({
      status: { authors: 'idle', byAuthor: 'idle', current: 'failed' },
      error: { authors: null, byAuthor: null, current: 'Plano no encontrado' },
    })
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    expect(screen.getByText(/Plano no encontrado/i)).toBeInTheDocument()
  })

  it('muestra el top 5 de blueprints por cantidad de puntos', () => {
    const all = [
      { author: 'a', name: 'p1', points: new Array(2).fill({ x: 0, y: 0 }) },
      { author: 'a', name: 'p2', points: new Array(6).fill({ x: 0, y: 0 }) },
      { author: 'b', name: 'p3', points: new Array(4).fill({ x: 0, y: 0 }) },
      { author: 'b', name: 'p4', points: new Array(5).fill({ x: 0, y: 0 }) },
      { author: 'c', name: 'p5', points: new Array(1).fill({ x: 0, y: 0 }) },
      { author: 'c', name: 'p6', points: new Array(3).fill({ x: 0, y: 0 }) },
    ]
    const store = makeStore({ all })
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    expect(screen.getByText('p2')).toBeInTheDocument()
    expect(screen.getByText('p4')).toBeInTheDocument()
    expect(screen.getByText('p3')).toBeInTheDocument()
    expect(screen.getByText('p6')).toBeInTheDocument()
    expect(screen.getByText('p1')).toBeInTheDocument()
    expect(screen.queryByText('p5')).not.toBeInTheDocument()
  })

  it('permite elegir un autor desde el <select> y dispara la búsqueda', () => {
    const store = makeStore({ authors: ['jdoe', 'msmith'] })
    const spy = vi.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    fireEvent.change(screen.getByLabelText(/elige un autor/i), { target: { value: 'jdoe' } })

    expect(spy).toHaveBeenCalledWith({ type: 'blueprints/fetchByAuthor', payload: 'jdoe' })
  })

  it('abre un blueprint del top 5 al hacer click en su fila', () => {
    const all = [
      { author: 'a', name: 'p1', points: new Array(2).fill({ x: 0, y: 0 }) },
      { author: 'a', name: 'p2', points: new Array(6).fill({ x: 0, y: 0 }) },
    ]
    const store = makeStore({ all })
    const spy = vi.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    fireEvent.click(screen.getByText('p2'))

    expect(spy).toHaveBeenCalledWith({
      type: 'blueprints/fetchBlueprint',
      payload: { author: 'a', name: 'p2' },
    })
  })

  it('el banner de fetchAuthors se muestra en vez de "Aún no hay datos" y permite reintentar', () => {
    const store = makeStore({
      status: { authors: 'failed', byAuthor: 'idle', current: 'idle' },
      error: { authors: 'Error de red', byAuthor: null, current: null },
    })
    const spy = vi.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    expect(screen.getByText(/Error de red/i)).toBeInTheDocument()
    expect(screen.queryByText(/Aún no hay datos suficientes/i)).not.toBeInTheDocument()

    spy.mockClear()
    fireEvent.click(screen.getByText(/Reintentar/i))

    expect(spy).toHaveBeenCalledWith({ type: 'blueprints/fetchAuthors' })
  })

  it('esconde "Total user points" antes de buscar un autor', () => {
    const store = makeStore()
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    expect(screen.getByText(/Busca un autor para ver sus planos/i)).toBeInTheDocument()
    expect(screen.queryByText(/Total user points/i)).not.toBeInTheDocument()
  })
})
