import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('apimock', () => {
  let apimock

  beforeEach(async () => {
    vi.resetModules()
    apimock = (await import('../src/services/apimock.js')).default
  })

  it('getAll devuelve todos los blueprints en memoria', async () => {
    const all = await apimock.getAll()
    expect(all.length).toBeGreaterThanOrEqual(6)
    expect(all.some((bp) => bp.author === 'jdoe')).toBe(true)
    expect(all.some((bp) => bp.author === 'msmith')).toBe(true)
  })

  it('getByAuthor devuelve solo los blueprints de ese autor', async () => {
    const items = await apimock.getByAuthor('jdoe')
    expect(items.length).toBe(3)
    expect(items.every((bp) => bp.author === 'jdoe')).toBe(true)
  })

  it('getByAuthor devuelve lista vacía si el autor no tiene planos', async () => {
    const items = await apimock.getByAuthor('nobody')
    expect(items).toEqual([])
  })

  it('getByAuthorAndName devuelve el blueprint solicitado', async () => {
    const bp = await apimock.getByAuthorAndName('jdoe', 'house')
    expect(bp).toMatchObject({ author: 'jdoe', name: 'house' })
    expect(bp.points.length).toBeGreaterThan(0)
  })

  it('getByAuthorAndName lanza un error 404 si el blueprint no existe', async () => {
    await expect(apimock.getByAuthorAndName('jdoe', 'no-existe')).rejects.toMatchObject({
      response: { status: 404 },
    })
  })

  it('create agrega un blueprint nuevo y lo devuelve', async () => {
    const created = await apimock.create({ author: 'new-author', name: 'new-plan', points: [] })
    expect(created).toEqual({ author: 'new-author', name: 'new-plan', points: [] })
    const items = await apimock.getByAuthor('new-author')
    expect(items).toEqual([created])
  })

  it('create lanza un error si el blueprint ya existe', async () => {
    await apimock.create({ author: 'dup-author', name: 'dup-plan', points: [] })
    await expect(
      apimock.create({ author: 'dup-author', name: 'dup-plan', points: [] }),
    ).rejects.toMatchObject({ response: { status: 409 } })
  })
})
