import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/services/http.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import http from '../src/services/http.js'
import apiClient from '../src/services/apiClient.js'

describe('apiClient', () => {
  beforeEach(() => {
    http.get.mockReset()
    http.post.mockReset()
    http.put.mockReset()
    http.delete.mockReset()
  })

  it('getAll acepta una respuesta directa (sin envoltura)', async () => {
    const payload = [{ author: 'jdoe', name: 'house', points: [] }]
    http.get.mockResolvedValueOnce({ data: payload })

    const result = await apiClient.getAll()

    expect(result).toEqual(payload)
    expect(http.get).toHaveBeenCalledWith('/api/blueprints')
  })

  it('getAll marca el error como "unsupported" cuando el backend responde 405', async () => {
    http.get.mockRejectedValueOnce({ response: { status: 405 } })

    await expect(apiClient.getAll()).rejects.toMatchObject({ unsupported: true })
  })

  it('getAll propaga sin marcar otros códigos de error', async () => {
    http.get.mockRejectedValueOnce({ response: { status: 500 } })

    const error = await apiClient.getAll().catch((e) => e)
    expect(error.unsupported).toBeUndefined()
  })

  it('getAll desenvuelve una respuesta { code, message, data }', async () => {
    const payload = [{ author: 'jdoe', name: 'house', points: [] }]
    http.get.mockResolvedValueOnce({ data: { code: 200, message: 'ok', data: payload } })

    const result = await apiClient.getAll()

    expect(result).toEqual(payload)
  })

  it('getByAuthor codifica el nombre del autor en la URL', async () => {
    http.get.mockResolvedValueOnce({ data: [] })

    await apiClient.getByAuthor('john doe')

    expect(http.get).toHaveBeenCalledWith('/api/blueprints/john%20doe')
  })

  it('getByAuthor devuelve [] cuando el backend responde 404', async () => {
    http.get.mockRejectedValueOnce({ response: { status: 404 } })

    const result = await apiClient.getByAuthor('ghost')

    expect(result).toEqual([])
  })

  it('getByAuthor propaga errores distintos de 404', async () => {
    http.get.mockRejectedValueOnce({ response: { status: 500 } })

    await expect(apiClient.getByAuthor('x')).rejects.toMatchObject({ response: { status: 500 } })
  })

  it('getByAuthorAndName codifica autor y nombre en la URL', async () => {
    http.get.mockResolvedValueOnce({ data: { author: 'john doe', name: 'my plan', points: [] } })

    await apiClient.getByAuthorAndName('john doe', 'my plan')

    expect(http.get).toHaveBeenCalledWith('/api/blueprints/john%20doe/my%20plan')
  })

  it('create envía "points" como string (el backend real solo acepta Map<String,String>)', async () => {
    const payload = {
      author: 'jdoe',
      name: 'house',
      points: [
        { x: 10, y: 10 },
        { x: 40, y: 60 },
      ],
    }
    http.post.mockResolvedValueOnce({ data: { id: 'new', name: 'house' } })

    await apiClient.create(payload)

    expect(http.post).toHaveBeenCalledWith('/api/blueprints', {
      author: 'jdoe',
      name: 'house',
      points: JSON.stringify(payload.points),
    })
    const sentBody = http.post.mock.calls[0][1]
    expect(typeof sentBody.author).toBe('string')
    expect(typeof sentBody.name).toBe('string')
    expect(typeof sentBody.points).toBe('string')
  })

  it('create desenvuelve la respuesta', async () => {
    const created = { id: 'new', name: 'house' }
    http.post.mockResolvedValueOnce({ data: { code: 201, message: 'created', data: created } })

    const result = await apiClient.create({ author: 'jdoe', name: 'house', points: [] })

    expect(result).toEqual(created)
  })

  it('create funciona aunque el backend responda sin cuerpo', async () => {
    http.post.mockResolvedValueOnce({ data: undefined })

    const result = await apiClient.create({ author: 'jdoe', name: 'house', points: [] })

    expect(result).toBeUndefined()
  })

  it('update envía PUT a la ruta autor/nombre con los puntos como string', async () => {
    const points = [{ x: 1, y: 1 }]
    http.put.mockResolvedValueOnce({ data: { author: 'jdoe', name: 'house', points } })

    const result = await apiClient.update('jdoe', 'house', { points })

    expect(http.put).toHaveBeenCalledWith('/api/blueprints/jdoe/house', {
      author: 'jdoe',
      name: 'house',
      points: JSON.stringify(points),
    })
    expect(result).toEqual({ author: 'jdoe', name: 'house', points })
  })

  it('update marca el error como "unsupported" cuando el backend responde 404 o 405', async () => {
    http.put.mockRejectedValueOnce({ response: { status: 404 } })
    await expect(apiClient.update('jdoe', 'house', { points: [] })).rejects.toMatchObject({
      unsupported: true,
    })

    http.put.mockRejectedValueOnce({ response: { status: 405 } })
    await expect(apiClient.update('jdoe', 'house', { points: [] })).rejects.toMatchObject({
      unsupported: true,
    })
  })

  it('update propaga otros errores sin marcarlos como unsupported', async () => {
    http.put.mockRejectedValueOnce({ response: { status: 500 } })
    const error = await apiClient.update('jdoe', 'house', { points: [] }).catch((e) => e)
    expect(error.unsupported).toBeUndefined()
  })

  it('remove envía DELETE a la ruta autor/nombre', async () => {
    http.delete.mockResolvedValueOnce({ data: { author: 'jdoe', name: 'house' } })

    const result = await apiClient.remove('jdoe', 'house')

    expect(http.delete).toHaveBeenCalledWith('/api/blueprints/jdoe/house')
    expect(result).toEqual({ author: 'jdoe', name: 'house' })
  })

  it('remove marca el error como "unsupported" cuando el backend responde 404 o 405', async () => {
    http.delete.mockRejectedValueOnce({ response: { status: 404 } })
    await expect(apiClient.remove('jdoe', 'house')).rejects.toMatchObject({ unsupported: true })
  })
})
