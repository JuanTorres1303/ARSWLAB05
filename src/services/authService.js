import http from './http.js'

function isMockEnabled() {
  return import.meta.env.VITE_USE_MOCK === 'true'
}

async function mockLogin(username, password) {
  if (!username?.trim() || !password?.trim()) {
    const error = new Error('Usuario y contraseña son obligatorios')
    error.response = { status: 401 }
    throw error
  }
  return { access_token: `mock-token-${username}` }
}

async function login(username, password) {
  if (isMockEnabled()) {
    return mockLogin(username, password)
  }
  const { data } = await http.post('/auth/login', { username, password })
  return data
}

export default { login }
