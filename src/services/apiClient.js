import http from './http.js'

function unwrap(response) {
  const body = response.data
  const isEnvelope = body && typeof body === 'object' && 'data' in body && ('code' in body || 'message' in body)
  return isEnvelope ? body.data : body
}

async function getAll() {
  try {
    const response = await http.get('/api/blueprints')
    return unwrap(response)
  } catch (err) {
    if (err.response && err.response.status === 405) {
      const unsupportedError = new Error('This backend does not support listing all blueprints')
      unsupportedError.unsupported = true
      throw unsupportedError
    }
    throw err
  }
}

async function getByAuthor(author) {
  try {
    const response = await http.get(`/api/blueprints/${encodeURIComponent(author)}`)
    return unwrap(response)
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return []
    }
    throw err
  }
}

async function getByAuthorAndName(author, name) {
  const response = await http.get(
    `/api/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
  )
  return unwrap(response)
}

async function create(payload) {
  // El endpoint real (@RequestBody Map<String, String>) solo acepta valores
  // string: un array en "points" hace que Jackson falle con 400 Bad Request.
  const body = {
    author: payload.author,
    name: payload.name,
    points: JSON.stringify(payload.points || []),
  }
  const response = await http.post('/api/blueprints', body)
  return unwrap(response)
}

export default { getAll, getByAuthor, getByAuthorAndName, create }
