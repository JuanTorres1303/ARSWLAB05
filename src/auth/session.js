import { useEffect, useState } from 'react'

const TOKEN_KEY = 'token'
const AUTH_EVENT = 'auth-changed'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function extractToken(payload) {
  if (!payload) return null
  return payload.access_token || payload.token || extractToken(payload.data) || null
}

export function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

export function useAuth() {
  const [token, setTokenState] = useState(getToken())

  useEffect(() => {
    const sync = () => setTokenState(getToken())
    window.addEventListener(AUTH_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUTH_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return { isAuthenticated: !!token, token }
}
