import { describe, it, expect } from 'vitest'
import { toFriendlyErrorMessage } from '../src/utils/errorMessages.js'

describe('toFriendlyErrorMessage', () => {
  it('traduce un error de red ("Network Error")', () => {
    const error = new Error('Network Error')
    expect(toFriendlyErrorMessage(error)).toBe('No se pudo conectar con el servidor')
  })

  it('traduce un 401 a un mensaje de sesión expirada', () => {
    const error = { message: 'Request failed with status code 401', response: { status: 401 } }
    expect(toFriendlyErrorMessage(error)).toBe('Tu sesión expiró, inicia sesión de nuevo')
  })

  it('traduce un 404 a "No se encontró el recurso"', () => {
    const error = { message: 'Request failed with status code 404', response: { status: 404 } }
    expect(toFriendlyErrorMessage(error)).toBe('No se encontró el recurso')
  })

  it('devuelve un mensaje genérico para cualquier otro error', () => {
    const error = { message: 'Request failed with status code 500', response: { status: 500 } }
    expect(toFriendlyErrorMessage(error)).toBe('Ocurrió un error inesperado. Intenta de nuevo más tarde.')
  })

  it('devuelve un mensaje genérico cuando el error no tiene response ni mensaje reconocido', () => {
    expect(toFriendlyErrorMessage(new Error('algo raro'))).toBe(
      'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
    )
  })
})
