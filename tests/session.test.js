import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, clearToken, extractToken } from '../src/auth/session.js'

describe('session helpers', () => {
  beforeEach(() => localStorage.clear())

  it('setToken/getToken/clearToken manejan el ciclo completo', () => {
    expect(getToken()).toBeNull()
    setToken('abc123')
    expect(getToken()).toBe('abc123')
    clearToken()
    expect(getToken()).toBeNull()
  })

  describe('extractToken', () => {
    it('lee access_token directo', () => {
      expect(extractToken({ access_token: 'a' })).toBe('a')
    })

    it('lee token directo', () => {
      expect(extractToken({ token: 'b' })).toBe('b')
    })

    it('lee access_token envuelto en data', () => {
      expect(extractToken({ data: { access_token: 'c' } })).toBe('c')
    })

    it('lee token envuelto en data', () => {
      expect(extractToken({ data: { token: 'd' } })).toBe('d')
    })

    it('devuelve null si no hay token reconocible', () => {
      expect(extractToken({})).toBeNull()
      expect(extractToken(null)).toBeNull()
      expect(extractToken({ data: {} })).toBeNull()
    })
  })
})
