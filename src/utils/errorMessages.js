export function toFriendlyErrorMessage(error) {
  const status = error?.response?.status
  if (status === 400) return 'Datos inválidos: revisa autor, nombre y puntos'
  if (status === 401) return 'Tu sesión expiró, inicia sesión de nuevo'
  if (status === 403) return 'No tienes permisos para realizar esta acción'
  if (status === 404) return 'No se encontró el recurso'
  if (error?.message === 'Network Error') return 'No se pudo conectar con el servidor'
  return 'Ocurrió un error inesperado. Intenta de nuevo más tarde.'
}
