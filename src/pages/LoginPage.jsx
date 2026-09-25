import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import authService from '../services/authService.js'
import { extractToken, setToken } from '../auth/session.js'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const data = await authService.login(username, password)
      const token = extractToken(data)
      if (!token) {
        setError('La respuesta del servidor no incluyó un token válido')
        return
      }
      setToken(token)
      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError('Credenciales inválidas o servidor no disponible')
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Login</h2>
      <div className="grid cols-2">
        <div>
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      <button className="btn primary form-field">Ingresar</button>
    </form>
  )
}
