import { describe, it, expect, afterEach, vi } from 'vitest'

describe('blueprintsService', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('usa apimock cuando VITE_USE_MOCK=true', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true')
    vi.resetModules()

    const { default: blueprintsService } = await import('../src/services/blueprintsService.js')
    const { default: apiMock } = await import('../src/services/apimock.js')

    expect(blueprintsService).toBe(apiMock)
  })

  it('usa apiClient cuando VITE_USE_MOCK=false', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.resetModules()

    const { default: blueprintsService } = await import('../src/services/blueprintsService.js')
    const { default: apiClient } = await import('../src/services/apiClient.js')

    expect(blueprintsService).toBe(apiClient)
  })

  it('apimock y apiClient exponen la misma interfaz de 4 métodos', async () => {
    const { default: apiMock } = await import('../src/services/apimock.js')
    const { default: apiClient } = await import('../src/services/apiClient.js')

    const methods = ['getAll', 'getByAuthor', 'getByAuthorAndName', 'create']
    for (const method of methods) {
      expect(typeof apiMock[method]).toBe('function')
      expect(typeof apiClient[method]).toBe('function')
    }
  })
})
