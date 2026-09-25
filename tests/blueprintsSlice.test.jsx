import { describe, it, expect } from 'vitest'
import reducer, {
  deleteBlueprint,
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  selectTopBlueprints,
  updateBlueprint,
} from '../src/features/blueprints/blueprintsSlice.js'

describe('blueprints slice', () => {
  it('should initialize correctly', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.authors).toEqual([])
    expect(state.all).toEqual([])
    expect(state.status).toEqual({
      authors: 'idle',
      byAuthor: 'idle',
      current: 'idle',
      update: 'idle',
      delete: 'idle',
    })
    expect(state.error).toEqual({
      authors: null,
      byAuthor: null,
      current: null,
      update: null,
      delete: null,
    })
  })

  describe('fetchAuthors', () => {
    it('fulfilled guarda los autores únicos y el catálogo completo', () => {
      const items = [
        { author: 'jdoe', name: 'house', points: [] },
        { author: 'jdoe', name: 'garage', points: [] },
        { author: 'msmith', name: 'tower', points: [] },
      ]
      const action = fetchAuthors.fulfilled(
        { authors: ['jdoe', 'msmith'], items },
        'reqId',
        undefined,
      )
      const state = reducer(undefined, action)
      expect(state.status.authors).toBe('succeeded')
      expect(state.authors).toEqual(['jdoe', 'msmith'])
      expect(state.all).toEqual(items)
    })

    it('rejected con { unsupported: true } marca status.authors como "unsupported" sin error visible', () => {
      const action = fetchAuthors.rejected(new Error('405'), 'reqId', undefined, {
        unsupported: true,
      })
      const state = reducer(undefined, action)
      expect(state.status.authors).toBe('unsupported')
      expect(state.error.authors).toBeNull()
    })

    it('rejected con un error normal marca status.authors como "failed" y guarda el mensaje', () => {
      const action = fetchAuthors.rejected(new Error('network down'), 'reqId', undefined, {
        message: 'No se pudo conectar con el servidor',
      })
      const state = reducer(undefined, action)
      expect(state.status.authors).toBe('failed')
      expect(state.error.authors).toBe('No se pudo conectar con el servidor')
    })
  })

  describe('fetchByAuthor', () => {
    it('pending pone status.byAuthor en loading y limpia el error', () => {
      const prev = reducer(undefined, { type: '@@INIT' })
      const withError = { ...prev, error: { ...prev.error, byAuthor: 'error previo' } }
      const state = reducer(withError, fetchByAuthor.pending('reqId', 'jdoe'))
      expect(state.status.byAuthor).toBe('loading')
      expect(state.error.byAuthor).toBeNull()
    })

    it('fulfilled guarda los items bajo el autor y marca succeeded', () => {
      const items = [{ author: 'jdoe', name: 'house', points: [] }]
      const action = fetchByAuthor.fulfilled({ author: 'jdoe', items }, 'reqId', 'jdoe')
      const state = reducer(undefined, action)
      expect(state.status.byAuthor).toBe('succeeded')
      expect(state.byAuthor.jdoe).toEqual(items)
    })

    it('rejected marca status.byAuthor failed y guarda el mensaje de error (payload)', () => {
      const action = fetchByAuthor.rejected(
        new Error('network down'),
        'reqId',
        'jdoe',
        'No se pudo conectar con el servidor',
      )
      const state = reducer(undefined, action)
      expect(state.status.byAuthor).toBe('failed')
      expect(state.error.byAuthor).toBe('No se pudo conectar con el servidor')
    })
  })

  describe('fetchBlueprint', () => {
    it('pending pone status.current en loading y limpia el error', () => {
      const prev = reducer(undefined, { type: '@@INIT' })
      const withError = { ...prev, error: { ...prev.error, current: 'error previo' } }
      const state = reducer(
        withError,
        fetchBlueprint.pending('reqId', { author: 'jdoe', name: 'house' }),
      )
      expect(state.status.current).toBe('loading')
      expect(state.error.current).toBeNull()
    })

    it('fulfilled guarda el blueprint como current y marca succeeded', () => {
      const bp = { author: 'jdoe', name: 'house', points: [{ x: 1, y: 1 }] }
      const action = fetchBlueprint.fulfilled(bp, 'reqId', { author: 'jdoe', name: 'house' })
      const state = reducer(undefined, action)
      expect(state.status.current).toBe('succeeded')
      expect(state.current).toEqual(bp)
    })

    it('rejected marca status.current failed y guarda el mensaje de error (payload)', () => {
      const action = fetchBlueprint.rejected(
        new Error('not found'),
        'reqId',
        { author: 'jdoe', name: 'ghost' },
        'No se encontró el recurso',
      )
      const state = reducer(undefined, action)
      expect(state.status.current).toBe('failed')
      expect(state.error.current).toBe('No se encontró el recurso')
    })
  })

  function buildLoadedState() {
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(
      state,
      fetchByAuthor.fulfilled(
        { author: 'jdoe', items: [{ author: 'jdoe', name: 'house', points: [{ x: 1, y: 1 }] }] },
        'reqId',
        'jdoe',
      ),
    )
    state = reducer(
      state,
      fetchBlueprint.fulfilled(
        { author: 'jdoe', name: 'house', points: [{ x: 1, y: 1 }] },
        'reqId',
        { author: 'jdoe', name: 'house' },
      ),
    )
    return state
  }

  describe('updateBlueprint (optimistic)', () => {
    it('pending aplica los nuevos puntos de inmediato en current y byAuthor', () => {
      const loaded = buildLoadedState()
      const newPoints = [{ x: 9, y: 9 }, { x: 8, y: 8 }]
      const state = reducer(
        loaded,
        updateBlueprint.pending('reqId', { author: 'jdoe', name: 'house', points: newPoints }),
      )

      expect(state.status.update).toBe('loading')
      expect(state.current.points).toEqual(newPoints)
      expect(state.byAuthor.jdoe[0].points).toEqual(newPoints)
    })

    it('fulfilled confirma los puntos devueltos por el backend', () => {
      const loaded = buildLoadedState()
      const newPoints = [{ x: 9, y: 9 }]
      const pending = reducer(
        loaded,
        updateBlueprint.pending('reqId', { author: 'jdoe', name: 'house', points: newPoints }),
      )
      const state = reducer(
        pending,
        updateBlueprint.fulfilled(
          { author: 'jdoe', name: 'house', points: newPoints },
          'reqId',
          { author: 'jdoe', name: 'house', points: newPoints },
        ),
      )

      expect(state.status.update).toBe('succeeded')
      expect(state.current.points).toEqual(newPoints)
      expect(state.byAuthor.jdoe[0].points).toEqual(newPoints)
    })

    it('rejected revierte current y byAuthor a los puntos previos y guarda el error', () => {
      const loaded = buildLoadedState()
      const originalPoints = loaded.current.points
      const newPoints = [{ x: 9, y: 9 }]
      const arg = { author: 'jdoe', name: 'house', points: newPoints }
      const pending = reducer(loaded, updateBlueprint.pending('reqId', arg))

      expect(pending.current.points).toEqual(newPoints)

      const state = reducer(
        pending,
        updateBlueprint.rejected(new Error('fail'), 'reqId', arg, 'No se pudo guardar'),
      )

      expect(state.status.update).toBe('failed')
      expect(state.error.update).toBe('No se pudo guardar')
      expect(state.current.points).toEqual(originalPoints)
      expect(state.byAuthor.jdoe[0].points).toEqual(originalPoints)
    })
  })

  describe('deleteBlueprint (optimistic)', () => {
    it('pending quita el blueprint de byAuthor y limpia current si coincide', () => {
      const loaded = buildLoadedState()
      const state = reducer(
        loaded,
        deleteBlueprint.pending('reqId', { author: 'jdoe', name: 'house' }),
      )

      expect(state.status.delete).toBe('loading')
      expect(state.byAuthor.jdoe).toEqual([])
      expect(state.current).toBeNull()
    })

    it('fulfilled deja el blueprint eliminado y marca succeeded', () => {
      const loaded = buildLoadedState()
      const arg = { author: 'jdoe', name: 'house' }
      const pending = reducer(loaded, deleteBlueprint.pending('reqId', arg))
      const state = reducer(pending, deleteBlueprint.fulfilled(arg, 'reqId', arg))

      expect(state.status.delete).toBe('succeeded')
      expect(state.byAuthor.jdoe).toEqual([])
      expect(state.current).toBeNull()
    })

    it('rejected restaura el blueprint en byAuthor y current, y guarda el error', () => {
      const loaded = buildLoadedState()
      const arg = { author: 'jdoe', name: 'house' }
      const pending = reducer(loaded, deleteBlueprint.pending('reqId', arg))

      expect(pending.byAuthor.jdoe).toEqual([])

      const state = reducer(
        pending,
        deleteBlueprint.rejected(new Error('fail'), 'reqId', arg, 'No se pudo eliminar'),
      )

      expect(state.status.delete).toBe('failed')
      expect(state.error.delete).toBe('No se pudo eliminar')
      expect(state.byAuthor.jdoe).toEqual(loaded.byAuthor.jdoe)
      expect(state.current).toEqual(loaded.current)
    })
  })

  describe('selectTopBlueprints', () => {
    it('devuelve los 5 blueprints con más puntos, ordenados de mayor a menor', () => {
      const all = [
        { author: 'a', name: 'p1', points: new Array(2).fill({ x: 0, y: 0 }) },
        { author: 'a', name: 'p2', points: new Array(6).fill({ x: 0, y: 0 }) },
        { author: 'b', name: 'p3', points: new Array(4).fill({ x: 0, y: 0 }) },
        { author: 'b', name: 'p4', points: new Array(5).fill({ x: 0, y: 0 }) },
        { author: 'c', name: 'p5', points: new Array(1).fill({ x: 0, y: 0 }) },
        { author: 'c', name: 'p6', points: new Array(3).fill({ x: 0, y: 0 }) },
      ]
      const top = selectTopBlueprints({ blueprints: { all } })
      expect(top.map((bp) => bp.name)).toEqual(['p2', 'p4', 'p3', 'p6', 'p1'])
      expect(top).toHaveLength(5)
    })

    it('devuelve un arreglo vacío cuando no hay datos', () => {
      expect(selectTopBlueprints({ blueprints: { all: [] } })).toEqual([])
    })
  })
})
