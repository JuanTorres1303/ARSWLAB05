import { describe, it, expect } from 'vitest'
import reducer, {
  fetchByAuthor,
  fetchBlueprint,
} from '../src/features/blueprints/blueprintsSlice.js'

describe('blueprints slice', () => {
  it('should initialize correctly', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.authors).toEqual([])
  })

  describe('fetchByAuthor', () => {
    it('pending pone status en loading y limpia el error', () => {
      const prev = reducer(undefined, { type: '@@INIT' })
      const withError = { ...prev, error: 'error previo' }
      const state = reducer(withError, fetchByAuthor.pending('reqId', 'jdoe'))
      expect(state.status).toBe('loading')
      expect(state.error).toBeNull()
    })

    it('fulfilled guarda los items bajo el autor y marca succeeded', () => {
      const items = [{ author: 'jdoe', name: 'house', points: [] }]
      const action = fetchByAuthor.fulfilled({ author: 'jdoe', items }, 'reqId', 'jdoe')
      const state = reducer(undefined, action)
      expect(state.status).toBe('succeeded')
      expect(state.byAuthor.jdoe).toEqual(items)
    })

    it('rejected marca status failed y guarda el mensaje de error', () => {
      const action = fetchByAuthor.rejected(new Error('network down'), 'reqId', 'jdoe')
      const state = reducer(undefined, action)
      expect(state.status).toBe('failed')
      expect(state.error).toBe('network down')
    })
  })

  describe('fetchBlueprint', () => {
    it('pending pone status en loading y limpia el error', () => {
      const prev = reducer(undefined, { type: '@@INIT' })
      const withError = { ...prev, error: 'error previo' }
      const state = reducer(
        withError,
        fetchBlueprint.pending('reqId', { author: 'jdoe', name: 'house' }),
      )
      expect(state.status).toBe('loading')
      expect(state.error).toBeNull()
    })

    it('fulfilled guarda el blueprint como current y marca succeeded', () => {
      const bp = { author: 'jdoe', name: 'house', points: [{ x: 1, y: 1 }] }
      const action = fetchBlueprint.fulfilled(bp, 'reqId', { author: 'jdoe', name: 'house' })
      const state = reducer(undefined, action)
      expect(state.status).toBe('succeeded')
      expect(state.current).toEqual(bp)
    })

    it('rejected marca status failed y guarda el mensaje de error', () => {
      const action = fetchBlueprint.rejected(new Error('not found'), 'reqId', {
        author: 'jdoe',
        name: 'ghost',
      })
      const state = reducer(undefined, action)
      expect(state.status).toBe('failed')
      expect(state.error).toBe('not found')
    })
  })
})
