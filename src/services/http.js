import axios from 'axios'
import { clearToken, getToken, redirectToLogin } from '../auth/session.js'

const configuredBaseURL = import.meta.env.VITE_API_BASE_URL
const baseURL = configuredBaseURL !== undefined ? configuredBaseURL : ''

const http = axios.create({
  baseURL,
  timeout: 8000,
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function handleResponseError(err) {
  if (err.response && err.response.status === 401) {
    clearToken()
    redirectToLogin()
  }
  return Promise.reject(err)
}

http.interceptors.response.use((res) => res, handleResponseError)

export default http
