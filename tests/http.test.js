import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/auth/session.js', () => ({
  getToken: vi.fn(() => null),
  clearToken: vi.fn(),
  redirectToLogin: vi.fn(),
}))

import { clearToken, redirectToLogin } from '../src/auth/session.js'
import { handleResponseError } from '../src/services/http.js'

describe('http response interceptor', () => {
  beforeEach(() => {
    clearToken.mockClear()
    redirectToLogin.mockClear()
  })

  it('ante un 401 borra el token y redirige a /login', async () => {
    await expect(handleResponseError({ response: { status: 401 } })).rejects.toBeTruthy()

    expect(clearToken).toHaveBeenCalled()
    expect(redirectToLogin).toHaveBeenCalled()
  })

  it('no borra el token ni redirige para otros códigos de error', async () => {
    await expect(handleResponseError({ response: { status: 500 } })).rejects.toBeTruthy()

    expect(clearToken).not.toHaveBeenCalled()
    expect(redirectToLogin).not.toHaveBeenCalled()
  })
})
