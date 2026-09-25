import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore, createSelector, createSlice } from '@reduxjs/toolkit'
import BlueprintsPage from '../src/pages/BlueprintsPage.jsx'

vi.mock('../src/features/blueprints/blueprintsSlice.js', () => ({
  fetchAuthors: () => ({ type: 'blueprints/fetchAuthors' }),
  fetchByAuthor: (author) => ({ type: 'blueprints/fetchByAuthor', payload: author }),
  fetchBlueprint: (payload) => ({ type: 'blueprints/fetchBlueprint', payload }),
  updateBlueprint: (payload) => ({ type: 'blueprints/updateBlueprint', payload }),
  deleteBlueprint: (payload) => ({ type: 'blueprints/deleteBlueprint', payload }),
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
  beforeEach(() => localStorage.clear())

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
    const store = makeStore({
      all,
      status: { authors: 'succeeded', byAuthor: 'idle', current: 'idle' },
    })
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
    const store = makeStore({
      all,
      status: { authors: 'succeeded', byAuthor: 'idle', current: 'idle' },
    })
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

  it('muestra "No disponible con este backend" cuando fetchAuthors no está soportado (405)', () => {
    const store = makeStore({
      status: { authors: 'unsupported', byAuthor: 'idle', current: 'idle' },
    })
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    expect(screen.getByText('No disponible con este backend.')).toBeInTheDocument()
    expect(screen.getByText(/Selector de autores no disponible/i)).toBeInTheDocument()
    expect(screen.queryByText(/Aún no hay datos suficientes/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Ocurrió un error inesperado/i)).not.toBeInTheDocument()
  })

  it('al abrir una fila sin "author" (datos del backend real) usa el autor buscado', () => {
    const store = makeStore({
      byAuthor: { jdoe: [{ id: 'b1', name: 'Plano de jdoe' }] },
    })
    const spy = vi.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'jdoe' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))
    fireEvent.click(screen.getByText(/Open/i))

    expect(spy).toHaveBeenCalledWith({
      type: 'blueprints/fetchBlueprint',
      payload: { author: 'jdoe', name: 'Plano de jdoe' },
    })
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

  it('no muestra los botones Editar/Eliminar en la tabla sin sesión iniciada', () => {
    const store = makeStore({ byAuthor: { jdoe: [{ author: 'jdoe', name: 'house', points: [] }] } })
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'jdoe' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))

    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.queryByText('Editar')).not.toBeInTheDocument()
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument()
  })

  it('muestra los botones Editar/Eliminar en la tabla con sesión iniciada', () => {
    localStorage.setItem('token', 'abc123')
    const store = makeStore({ byAuthor: { jdoe: [{ author: 'jdoe', name: 'house', points: [] }] } })
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'jdoe' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))

    expect(screen.getByText('Editar')).toBeInTheDocument()
    expect(screen.getByText('Eliminar')).toBeInTheDocument()
  })

  it('agrupa Open/Editar/Eliminar en un único contenedor de acciones (una sola fila)', () => {
    localStorage.setItem('token', 'abc123')
    const store = makeStore({ byAuthor: { jdoe: [{ author: 'jdoe', name: 'house', points: [] }] } })
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'jdoe' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))

    const openBtn = screen.getByText('Open')
    const editBtn = screen.getByText('Editar')
    const deleteBtn = screen.getByText('Eliminar')
    const actionsCell = openBtn.closest('td')
    const actionsContainer = openBtn.closest('.table-actions')

    expect(actionsContainer).not.toBeNull()
    expect(actionsContainer).toBe(editBtn.closest('.table-actions'))
    expect(actionsContainer).toBe(deleteBtn.closest('.table-actions'))
    expect(actionsCell.querySelectorAll('button')).toHaveLength(3)
    expect(openBtn.className).toContain('sm')
  })

  it('al hacer click en Eliminar abre un diálogo de confirmación propio (no window.confirm) y Cancelar lo cierra sin despachar', () => {
    localStorage.setItem('token', 'abc123')
    const alertSpy = vi.spyOn(window, 'confirm').mockImplementation(() => {
      throw new Error('no debería usarse window.confirm')
    })
    const store = makeStore({ byAuthor: { jdoe: [{ author: 'jdoe', name: 'house', points: [] }] } })
    const spy = vi.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <BlueprintsPage />
      </Provider>,
    )

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'jdoe' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))
    spy.mockClear()

    fireEvent.click(screen.getByText('Eliminar'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/¿Eliminar "house" de jdoe\?/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancelar'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(spy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'blueprints/deleteBlueprint' }),
    )
    alertSpy.mockRestore()
  })
})
