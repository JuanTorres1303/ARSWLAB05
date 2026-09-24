import http from './http.js'

function unwrap(response) {
  const body = response.data
  const isEnvelope = body && typeof body === 'object' && 'data' in body && ('code' in body || 'message' in body)
  return isEnvelope ? body.data : body
}

async function getAll() {
  const response = await http.get('/blueprints')
  return unwrap(response)
}

async function getByAuthor(author) {
  try {
    const response = await http.get(`/blueprints/${encodeURIComponent(author)}`)
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
    `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
  )
  return unwrap(response)
}

async function create(payload) {
  const response = await http.post('/blueprints', payload)
  return unwrap(response)
}

export default { getAll, getByAuthor, getByAuthorAndName, create }
