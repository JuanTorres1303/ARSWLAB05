import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('../src/services/blueprintsService.js', () => ({
  default: {
    getAll: vi.fn(),
    getByAuthor: vi.fn(),
    getByAuthorAndName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

import blueprintsService from '../src/services/blueprintsService.js'
import blueprintsReducer from '../src/features/blueprints/blueprintsSlice.js'
import BlueprintsPage from '../src/pages/BlueprintsPage.jsx'

function makeStore() {
  return configureStore({ reducer: { blueprints: blueprintsReducer } })
}

function renderWithStore(store) {
  return render(
    <Provider store={store}>
      <BlueprintsPage />
    </Provider>,
  )
}

async function openHouseBlueprint(store) {
  renderWithStore(store)
  fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'jdoe' } })
  fireEvent.click(screen.getByText(/Get blueprints/i))
  await screen.findByText('house')
  fireEvent.click(screen.getByText('Open'))
  await screen.findByText('Sin cambios pendientes')
}

describe('BlueprintsPage: edición interactiva del canvas y CRUD optimista (store real)', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'abc123')
    blueprintsService.getAll.mockReset().mockResolvedValue([])
    blueprintsService.getByAuthor
      .mockReset()
      .mockResolvedValue([{ author: 'jdoe', name: 'house', points: [{ x: 1, y: 1 }] }])
    blueprintsService.getByAuthorAndName
      .mockReset()
      .mockResolvedValue({ author: 'jdoe', name: 'house', points: [{ x: 1, y: 1 }] })
    blueprintsService.update.mockReset()
    blueprintsService.remove.mockReset()
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 520,
      height: 360,
    })
  })

  it('clic en el canvas agrega un punto y marca "Cambios sin guardar"', async () => {
    const store = makeStore()
    await openHouseBlueprint(store)

    const canvas = document.getElementById('canvas-blueprint')
    fireEvent.click(canvas, { clientX: 200, clientY: 80 })

    expect(await screen.findByText('Cambios sin guardar')).toBeInTheDocument()
    expect(screen.getByText('Guardar')).not.toBeDisabled()
  })

  it('"Deshacer último punto" quita el último punto agregado', async () => {
    const store = makeStore()
    await openHouseBlueprint(store)

    const canvas = document.getElementById('canvas-blueprint')
    fireEvent.click(canvas, { clientX: 200, clientY: 80 })
    await screen.findByText('Cambios sin guardar')

    fireEvent.click(screen.getByText('Deshacer último punto'))

    // El punto agregado ya no debería mandarse al guardar: verificamos que
    // el payload de update solo contenga el punto original.
    blueprintsService.update.mockResolvedValue({
      author: 'jdoe',
      name: 'house',
      points: [{ x: 1, y: 1 }],
    })
    fireEvent.click(screen.getByText('Guardar'))

    await waitFor(() => expect(blueprintsService.update).toHaveBeenCalled())
    expect(blueprintsService.update).toHaveBeenCalledWith('jdoe', 'house', {
      author: 'jdoe',
      name: 'house',
      points: [{ x: 1, y: 1 }],
    })
  })

  it('"Descartar cambios" revierte al último punto guardado', async () => {
    const store = makeStore()
    await openHouseBlueprint(store)

    const canvas = document.getElementById('canvas-blueprint')
    fireEvent.click(canvas, { clientX: 200, clientY: 80 })
    await screen.findByText('Cambios sin guardar')

    fireEvent.click(screen.getByText('Descartar cambios'))

    await screen.findByText('Sin cambios pendientes')
    expect(screen.getByText('Guardar')).toBeDisabled()
  })

  it('rollback optimista de updateBlueprint: si falla el guardado, revierte el punto en el store y muestra el error', async () => {
    const store = makeStore()
    await openHouseBlueprint(store)

    const canvas = document.getElementById('canvas-blueprint')
    fireEvent.click(canvas, { clientX: 200, clientY: 80 })
    await screen.findByText('Cambios sin guardar')

    blueprintsService.update.mockRejectedValueOnce({ response: { status: 500 } })
    fireEvent.click(screen.getByText('Guardar'))

    await waitFor(() => expect(store.getState().blueprints.status.update).toBe('failed'))
    // El estado optimista debe haberse revertido a los puntos originales.
    expect(store.getState().blueprints.current.points).toEqual([{ x: 1, y: 1 }])
    expect(store.getState().blueprints.byAuthor.jdoe[0].points).toEqual([{ x: 1, y: 1 }])
    // El borrador local conserva el intento fallido para poder reintentar.
    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument()

    blueprintsService.update.mockResolvedValueOnce({
      author: 'jdoe',
      name: 'house',
      points: [{ x: 1, y: 1 }, { x: 200, y: 80 }],
    })
    fireEvent.click(screen.getByText('Guardar'))

    await waitFor(() => expect(store.getState().blueprints.status.update).toBe('succeeded'))
    expect(store.getState().blueprints.current.points).toEqual([
      { x: 1, y: 1 },
      { x: 200, y: 80 },
    ])
    await screen.findByText('Sin cambios pendientes')
  })

  it('rollback optimista de deleteBlueprint: si falla el borrado, el blueprint reaparece en la lista', async () => {
    const store = makeStore()
    renderWithStore(store)
    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'jdoe' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))
    await screen.findByText('house')

    fireEvent.click(screen.getByText('Eliminar'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/¿Eliminar "house" de jdoe\?/i)).toBeInTheDocument()

    blueprintsService.remove.mockRejectedValueOnce({ response: { status: 500 } })
    fireEvent.click(within(dialog).getByText('Eliminar'))

    await waitFor(() => expect(store.getState().blueprints.status.delete).toBe('failed'))
    expect(store.getState().blueprints.byAuthor.jdoe).toHaveLength(1)
    expect(screen.getByText('house')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deleteBlueprint exitoso: el blueprint desaparece de la lista tras confirmar', async () => {
    const store = makeStore()
    renderWithStore(store)
    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'jdoe' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))
    await screen.findByText('house')

    blueprintsService.remove.mockResolvedValueOnce({ author: 'jdoe', name: 'house' })
    fireEvent.click(screen.getByText('Eliminar'))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByText('Eliminar'))

    await waitFor(() => expect(store.getState().blueprints.status.delete).toBe('succeeded'))
    expect(store.getState().blueprints.byAuthor.jdoe).toEqual([])
  })
})
