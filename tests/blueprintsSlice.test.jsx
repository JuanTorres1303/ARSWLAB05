import { describe, it, expect } from 'vitest'
import reducer, {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  selectTopBlueprints,
} from '../src/features/blueprints/blueprintsSlice.js'

describe('blueprints slice', () => {
  it('should initialize correctly', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.authors).toEqual([])
    expect(state.all).toEqual([])
    expect(state.status).toEqual({ authors: 'idle', byAuthor: 'idle', current: 'idle' })
    expect(state.error).toEqual({ authors: null, byAuthor: null, current: null })
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
